"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isUserExist, serializeTransation } from "./helpers";

type DataInterface = {
    name: string
    type: string
    balance: number
    isDefault:boolean
};


export async function createAccount(data :DataInterface){
    try{
        const user = await isUserExist();

        if(!user) throw new Error("User Not found");

        const {balance} = data

        // Convert balance to float
        const balanceFloat= parseFloat(balance.toString());
        if(isNaN(balanceFloat)){
            throw new Error("Invalid balance amount")
        }

        const existingAccount = await db.account.findMany({
            where:{ userId: user.id}
        });

        const shouldBeDefault= existingAccount.length===0?true:data.isDefault;

        if(shouldBeDefault){
            // if this account should be default then make other not default 
            await db.account.updateMany({
                where:{ userId: user.id, isDefault: true},
                data:{ isDefault:false}
            });
        };

        const account= await db.account.create({
            data: {
                ...data,
                balance:balanceFloat,
                userId:user.id,
                isDefault:shouldBeDefault
            }
        });
        
        const serializedAccount=serializeTransation(account);

        revalidatePath("/dashboard");

        return {success:true, data:serializedAccount}
    }
    catch(error){
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("An unknown error occurred");
        }
    }
}

export async function getUserAccounts() {
    try{
        const user = await isUserExist();
        if(!user) throw new Error("User Not found");

        const accounts = await db.account.findMany({
            where:{ userId: user.id },
            orderBy: { createdAt: "desc" },
            include:{
                _count:{
                    select:{
                        transactions:true
                    }
                }
            }
        })

        const serializedAccounts=accounts.map(account=>serializeTransation(account))

        return serializedAccounts
    }
    catch(error){
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("An unknown error occurred");
        }
    }
}

export async function getDashboardData() {
    const user = await isUserExist();
    if(!user) throw new Error("User Not found");
    
    // Get all user transactions
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });
  
    return transactions.map(serializeTransation);
}