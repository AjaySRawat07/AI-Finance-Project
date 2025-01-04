"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type DataInterface = {
    name: String
    type: String
    balance: Number
    isDefault:Boolean
};

const serializeTransation= (object: any)=>{
    const serialized= {...object};
    if(object.balance){
        serialized.balance= object.balance.toNumber();
    }

}
export async function createAccount(data :DataInterface){
    try{
        const { userId } = await auth();
        if(!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where:{
                clerkUserId: userId
            }
        })

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

        const account= db.account.create({
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
        throw new Error(error.message);
    }
}