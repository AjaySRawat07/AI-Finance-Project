"use client"; 

import { createTransaction } from '@/actions/transaction';
import { transactionSchema } from '@/app/lib/schema';
import CreateAccountDrawer from '@/components/CreateAccountDrawer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/useFetch';
import { zodResolver } from '@hookform/resolvers/zod';
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';


type AccountType= {
  id: string
  name: string
  type: string
  balance: number
  userId: string
  isDefault: boolean
}

  
type TransactionPageProps = {
  accounts: AccountType[];
  categories: string[];
};


const AddTransactionForm = ({accounts, categories}:TransactionPageProps) => {
 const router= useRouter()
  const {
    register,
    setValue,
    handleSubmit,
    formState:{errors},
    watch,
    getValues,
    reset
  }=  useForm({
    resolver:zodResolver(transactionSchema),
    defaultValues:{
      type:"EXPENSE",
      amount:"",
      description: "",
      accountId: accounts.find((ac)=> ac.isDefault)?.id,
      date: new Date(),
      isRecurring:false,
      category:'',
      recurringInterval:"DAILY"
    }
  })

  const {
    loading: transactionloading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(createTransaction)

  const type= watch('type')
  const isRecurring= watch('isRecurring')
  const date= watch('date')

  const filteredCategories = categories.filter(
    (category:any)=>category.type===type
  )

  const onSubmit=(data:any) => {
    const formData={
      ...data,
      amount:parseFloat(`${data.amount}`),
    }
    transactionFn(formData)
  }

  useEffect(()=>{
    if(transactionResult && transactionResult.success && !transactionloading){
      toast.success("Transaction create sucessfully");
      reset();
      router.push(`/account/${transactionResult.data.accountId}`)
    }
  },[transactionResult, transactionloading])

  return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
      {/* Ai reciept scanner */}

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Type</label>
        <Select 
          defaultValue={type} 
          onValueChange={(value)=>setValue('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select type'/>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        {errors.type && (
          <p className='text-sm text-red-500'>{errors.type.message}</p>
        )}
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Amount</label>
          <Input 
              id="amount"
              placeholder='0.0'
              step={"0.01"}
              {...register("amount")}
            />
            {errors.amount && (
              <p className='text-sm text-red-500'>{errors.amount.message}</p>
            )}

          {errors.type && (
            <p className='text-sm text-red-500'>{errors.type.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Account</label>
          <Select 
            defaultValue={getValues('accountId')} 
            onValueChange={(value)=>setValue('accountId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select account'/>
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account)=>(
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(`${account.balance}`).toFixed(2)})
                </SelectItem>
              ))}
               <CreateAccountDrawer>
                <Button variant='ghost' className='w-full select-name items-center text-sm outline-none'>
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>

          {errors.accountId && (
            <p className='text-sm text-red-500'>{errors.accountId.message}</p>
          )}
        </div>
      </div>

      <div className='space-y-2'>
          <label className='text-sm font-medium'>Category</label>
          <Select 
            defaultValue={getValues('category')} 
            onValueChange={(value)=>setValue('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select category'/>
            </SelectTrigger>

            <SelectContent>
              {filteredCategories.map((category)=>(
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.category && (
            <p className='text-sm text-red-500'>{errors.category.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Date</label>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className='w-full pl-3 text-left font-normal'
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}

                <CalendarIcon className='ml-auto h-4 w-4 opacity-50'/>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
              style={{background:'white'}}
                mode='single'
                selected={date}
                onSelect={(date)=>setValue("date", date)}
                disabled={(date)=>{
                  date> new Date() || date < new Date("1900-01-01")
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p className='text-sm text-red-500'>{errors.date.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Description</label>
          <Input 
              placeholder='Enter Description'
              {...register("description")}
            />
            {errors.description && (
              <p className='text-sm text-red-500'>{errors.description.message}</p>
            )}

          {errors.type && (
            <p className='text-sm text-red-500'>{errors.description.message}</p>
          )}
        </div>

        <div className='flex items-center justify-between rounded-lg border p-3'>
           <div className='space-y-0.5'>
              <label className='text-sm font-medium cursor-pointer' >
                Recurring Transaction
              </label>
              <p className='text-sm text-muted-foreground'>This account will be selected by default for transactions</p>
            </div>
            <Switch
              onCheckedChange={(checked)=> setValue("isRecurring", checked)}
              checked={isRecurring}
            />
        </div>

        {isRecurring && (
           <div className='space-y-2'>
            <label className='text-sm font-medium'>Recurring Interval</label>
            <Select 
              defaultValue={getValues('recurringInterval')} 
              onValueChange={(value)=>setValue('recurringInterval', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select interva;'/>
              </SelectTrigger>
  
              <SelectContent>
                <SelectItem value={"DAILY"}>Daily</SelectItem>
                <SelectItem value={"WEEKLY"}>Weekly</SelectItem>
                <SelectItem value={"MONTHLY"}>Monthly</SelectItem>
                <SelectItem value={"YEARLY"}>Yearly</SelectItem>
              </SelectContent>
            </Select>
  
            {errors.recurringInterval && (
              <p className='text-sm text-red-500'>{errors.recurringInterval.message}</p>
            )}
         </div>
        )}

        <div className='flex gap-4'>
          <Button 
            type='button'
            variant={'outline'}
            className='w-full'
            onClick={()=>router.back()}
          
          >Cancel</Button>
          <Button
            type='submit'
            className='w-full'
            disabled={transactionloading}
          >
            Create Transaction</Button>
        </div>
        
    </form>
  )
}

export default AddTransactionForm
