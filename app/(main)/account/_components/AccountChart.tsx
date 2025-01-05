"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import React, { useMemo, useState } from 'react'
import {Bar, BarChart, CartesianGrid, Legend, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Transaction = {
    id: string;
    type: "EXPENSE" | "INCOME"; 
    amount: number;
    description: string;
    date: string;
    category: string;
    receiptUrl: string | null;
    isRecurring: boolean;
    recurringInterval: string | null;
    nextRecurringDate: string | null;
    lastProcessed: string | null;
    status: "COMPLETED" | "PENDING"; 
    userId: string;
    accountId: string;
    createdAt: string;
    updatedAt: string;
  };
  
type TransactionPageProps = {
    transactions: Transaction[];
};

type DateRangeKey = "7D" | "1M" | "3M" | "6M" | "ALL";

type DateRange = {
  label: string;
  days: number | null;
};

  
const DATE_RANGES: Record<DateRangeKey, DateRange> = {
    "7D": { label: "Last 7 Days", days: 7 },
    "1M": { label: "Last Month", days: 30 },
    "3M": { label: "Last 3 Months", days: 90 },
    "6M": { label: "Last 6 Months", days: 180 },
    "ALL": { label: "All Time", days: null },
};

type GroupedTransactions = {
    [date: string]: {
      date: string; 
      income: number;
      expense: number;
    };
  };
  
     
const AccountChart = ({ transactions }:TransactionPageProps)  => {
    const [dateRange, setDateRange] = useState<string>('1M')

    const filteredData = useMemo(() => {
        const range = DATE_RANGES[dateRange as DateRangeKey];
        
        const now= new Date();
        const startDate =range.days
            ? startOfDay(subDays(now,range.days))
            :startOfDay(new Date(0));

        //filter transactions within date range

        const filtered = transactions.filter(
            (t)=> new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
        );

        const grouped = filtered.reduce<GroupedTransactions>((acc,transaction)=>{
            const date= format(new Date(transaction.date), "MMM dd");
            if(!acc[date]){
                acc[date]= { date, income: 0, expense: 0};
            }

            if(transaction.type==='INCOME'){
                acc[date].income += transaction.amount;
            }
            else{
                acc[date].expense += transaction.amount
            }

            return acc;
        },{})

        return Object.values(grouped).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ); 
    },[transactions,dateRange])

    const totals = useMemo(()=>{
        return filteredData.reduce(
            (acc,day)=>({
                income:acc.income + day.income,
                expense:acc.income + day.income
            }),
            { income:0, expense: 0 }
        )
    },[filteredData])

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-7'>
                <CardTitle className='text-base font-normal'>Transaction Overview</CardTitle>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className='w-[140px]'>
                        <SelectValue placeholder='Select Range'/>
                    </SelectTrigger>

                    <SelectContent>
                        {Object.entries(DATE_RANGES).map(([key, { label }]) => {
                            return <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        })}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className='flex justify-around mb-6 text-sm'>
                    <div className='text-center'>
                        <p className='text-muted-foreground'>Total Income</p>
                        <p className='text-lg font-bold text-green-500'>
                            ${totals.income.toFixed(2)}
                        </p>
                    </div>
                    <div className='text-center'>
                        <p className='text-muted-foreground'>Total Income</p>
                        <p className='text-lg font-bold text-red-500'>
                            ${totals.expense.toFixed(2)}
                        </p>
                    </div>
                    <div className='text-center'>
                        <p className='text-muted-foreground'>Total Income</p>
                        <p className={`text-lg font-bold ${totals.income - totals.expense >=0 ?
                        "text-green-500":
                        "text-red-500"
                        }`}
                        >
                            ${(totals.income - totals.expense).toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className='h-[300px]'>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 10,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value)=> `${value}`} 
                            />
                            <Tooltip formatter={(value)=> [`${value}`, undefined]}/>
                            <Legend />

                            <Bar 
                                dataKey="income"
                                name="Income"
                                fill="#22c55e"
                                radius={[4,4,0,0]} 
                            />

                            <Bar 
                                dataKey="expense"
                                name="Expense"
                                fill="#ef4444"
                                radius={[4,4,0,0]} 
                            />

                            <Bar dataKey="uv" fill="#82ca9d" activeBar={<Rectangle fill="gold" stroke="purple" />} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
        </CardContent>

        </Card>
    )
}

export default AccountChart
