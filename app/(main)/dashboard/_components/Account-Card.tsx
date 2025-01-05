"use client";

import { updateDefaultAccount } from '@/actions/accounts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/useFetch';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react'
import { toast } from 'sonner';


type AccountType = {
    name: string;
    type: string;
    balance: number;
    isDefault: boolean;
    id: string;
};

type AccountCardProps = {
    account: AccountType;
};

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
    const {name, type, balance, id, isDefault}= account

    const { 
        data: udpateAccount,
        error,
        fn: updateDefaultFunction,
        loading: updateDefaultLoading
    } =useFetch(updateDefaultAccount);

    const handleDefaultChange= async (event: React.MouseEvent<HTMLButtonElement>)=>{
        event.preventDefault();

        if(isDefault){
            toast.warning("You need atleast one default account");
            return
        }
        await updateDefaultFunction(id)
    }

    useEffect(()=>{
        if(udpateAccount && !updateDefaultLoading ){
            toast.success('Default account  updated successfully')
        }
    },[udpateAccount, updateDefaultLoading])

    useEffect(()=>{
        if(error){
            const errorMessage = error instanceof Error ? error.message : error;
            toast.error(errorMessage || "Failed to update default account" )
        }
    },[udpateAccount, updateDefaultLoading])

    return (
        <Card className='hover:shadow-md transition-shadow group relative'>
            <Link href={`/account/${id}`}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pd-2'>
                    <CardTitle className='text-sm font-medium capitalize'>{name}</CardTitle>
                    <Switch onClick={handleDefaultChange} checked={isDefault} disabled={updateDefaultLoading}/>
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>
                        ${parseFloat(balance.toString()).toFixed(2)}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                        {type.charAt(0) + type.slice(1).toLowerCase()} Account
                    </p>
                </CardContent>
                <CardFooter className='flex justify-between text-sm text-muted-foreground'>
                    <div className='flex items-center'>
                        <ArrowUpRight className='mr-1 h-4 w-4 text-green-500'/>
                        Income
                    </div>
                    <div className='flex items-center'>
                        <ArrowDownRight className='mr-1 h-4 w-4 text-red-500'/>
                        Expense
                    </div>
                </CardFooter>
            </Link>
        </Card>
    )
}

export default AccountCard
