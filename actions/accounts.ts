"use server"; 

import { db } from "@/lib/prisma";
import { isUserExist } from "./helpers";
import { revalidatePath } from "next/cache";

const serializeTransation= (object: any)=>{
    const serialized= {...object};
    if(object.balance){
        serialized.balance= object.balance.toNumber();
    }

    if(object.amount){
        serialized.amount= object.amount.toNumber();
    }
    
    return serialized
}

export async function updateDefaultAccount(accountId :string){
    try{
        const user = await isUserExist();

        if(!user) throw new Error("User Not found");

        await db.account.updateMany({
            where:{ userId: user.id, isDefault: true},
            data:{ isDefault:false}
         });

        const account = await db.account.update({
            where:{
                id:accountId,
                userId: user.id
            },
            data:{ isDefault: true }
        })

        revalidatePath('/dashboard')

        return { success:true,data: serializeTransation(account) }
    }
    catch(e){
        if (e instanceof Error) {
            return { success:false, error: e.message }
        } else {
            return { success:false, error: "error" }
        }
       
    }
}

export async function getAccountWithTransaction(accountId : string) {
    try{
        const user = await isUserExist();
        if(!user) throw new Error("User Not found");

        const account = await db.account.findUnique({
            where:{ id: accountId, userId: user.id },
            include:{
                transactions:{
                    orderBy: { date: 'desc'}
                },
                _count:{
                    select: {transactions : true}
                }
            }
        })

        if(!account) return null

        return {
            ...serializeTransation(account),
            transactions: account.transactions.map(serializeTransation)
        }
    }
    catch(error){
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("An unknown error occurred");
        }
    }
}