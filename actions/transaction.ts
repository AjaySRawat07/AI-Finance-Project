"use server"

import { revalidatePath } from "next/cache";
import { isUserExist, serializedAmount } from "./helpers";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import aj from "@/lib/inngest/arcjet";

type Transaction = {
    type: 'EXPENSE' | 'INCOME';
    accountId: string;
    id: string;
    category: string;
    amount: number;
    date: Date;
    isRecurring: boolean;
    recurringInterval: string;
  };

  
export async function createTransaction(data : Transaction) {
    try{
        const user = await isUserExist();
        if(!user) throw new Error("User Not found");

        const req = await request();

        const decision = await aj.protect(req,{
          userId:user.id,
          requested:1
        })

        if(decision.isDenied()){
          if(decision.reason.isRateLimit()){
            const { remaining, reset } = decision.reason;
            console.error({
              code: "RATE_LIMIT_EXCEEDED",
              details:{
                remaining,
                resetInSeconds:reset
              }
            })
            throw new Error("Too many request. please try again later")
          }
          throw new Error("Request blocked")
        }


        const { accountId, type, amount } = data

        const account = await db.account.findUnique({
            where:{ id: accountId, userId: user.id },
        })

        if(!account) throw new Error("User Not found");

        const balanceChange = type==='EXPENSE' ? -amount : amount
        const newBalance= account.balance.toNumber() + balanceChange

        const transaction = await db.$transaction(async(tx)=>{
            const newTransaction = await tx.transaction.create({
                data:{
                    ...data,
                    userId:user.id,
                    nextRecurringDate:
                     data.isRecurring &&  data.recurringInterval ? calculateNextRecurringDate(data.date, data.recurringInterval)
                     :null
                }
            });

            await tx.account.update({
                where: { id: data.accountId },
                data: {balance : newBalance}
            })
            return newTransaction
        });

        revalidatePath('/dashboard')
        revalidatePath(`/account/${transaction.accountId}`)

        return { success:true, data: serializedAmount(transaction)}
    }
    catch(error){
        console.log(error)
        return  new Error('Unknown Error Occured')
       
    }
}

function calculateNextRecurringDate(startDate: Date, interval : string) {
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