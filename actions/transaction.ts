"use server";

import { revalidatePath } from "next/cache";
import { isUserExist, serializedAmount } from "./helpers";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import aj from "@/lib/inngest/arcjet";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

type Transaction = {
  type: "EXPENSE" | "INCOME";
  accountId: string;
  id: string;
  category: string;
  amount: number;
  date: Date;
  isRecurring: boolean;
  recurringInterval: string;
};

export async function createTransaction(data: Transaction) {
  try {
    const user = await isUserExist();
    if (!user) throw new Error("User Not found");

    const req = await request();

    const decision = await aj.protect(req, {
      userId: user.id,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });
        throw new Error("Too many request. please try again later");
      }
      throw new Error("Request blocked");
    }

    const { accountId, type, amount } = data;

    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
    });

    if (!account) throw new Error("User Not found");

    const balanceChange = type === "EXPENSE" ? -amount : amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval ?
              calculateNextRecurringDate(data.date, data.recurringInterval)
            : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });
      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializedAmount(transaction) };
  } catch (error) {
    console.log(error);
    return new Error("Unknown Error Occured");
  }
}

function calculateNextRecurringDate(startDate: Date, interval: string) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

type ScanReceiptReturn = {
  amount: number;
  date: Date;
  description: string;
  category: string;
  merchantName: string;
};

export async function scanReceipt(file: File): Promise<ScanReceiptReturn> {
  try {
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

    //convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializedAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found!!");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE" ?
        -originalTransaction.amount.toNumber()
      : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // prisma transaction
    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval ?
              calculateNextRecurringDate(data.date, data.recurringInterval)
            : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializedAmount(transaction) };
  } catch (error) {
    throw new Error(error.message + "__Error in updateTransaction");
  }
}
