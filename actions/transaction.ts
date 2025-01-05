import { revalidatePath } from "next/cache";
import { isUserExist } from "./helpers";
import { db } from "@/lib/prisma";

type Transaction = {
    type: 'EXPENSE' | 'INCOME';
    accountId: string;
    id: string;
    category: string;
    amount: number;
    date: string;
  };

  
export async function createTransaction(data : Transaction) {
    try{
        const user = await isUserExist();
        if(!user) throw new Error("User Not found");

        const { accountId, type, amount } = data

        const account = await db.account.findUnique({
            where:{ id: accountId, userId: user.id },
        })

        if(!account) throw new Error("User Not found");

        const balanceChange = type==='EXPENSE' ? -amount : amount
        const newBalance= account.balance.toNumber() + balanceChange

        // const transaction = await db.$transaction(async(tx)=>{
        //     const newTransaction = await tx.transaction.create({
        //         data:{
        //             ...data,
        //             userId:user.id,
        //             nextRecurringDate: data.isRecurring && 
        //         }
        //     })
        // })

        return {success : true }
    }
    catch(error){
        const errorMessage = error instanceof Error ? error.message : error;
        return { success: false, error: errorMessage || "An unknown error occurred"}
       
    }
}