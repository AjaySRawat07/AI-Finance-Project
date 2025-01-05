import { getUserAccounts } from '@/actions/dashboard'
import CreateAccountDrawer from '@/components/CreateAccountDrawer'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import React from 'react'
import AccountCard from './_components/Account-Card'

const DashboardPage = async () => {
  const accounts= await getUserAccounts();

  return (
    <div className='px-5'>
       {/* Budget progress */}
    
       {/* Dashbpard Overview */}

       {/* Account grid */}

       <div className='grid gap-4 md:grid-cols-2 lg:grid-col-3'>
          <CreateAccountDrawer>
            <Card className='hover:shadow-md transition-shadow cursor-pointer border-dashed'>
              <CardContent className='flex flex-col items-center justify-center h-full pt-5 text-muted-foreground'>
                <Plus className='h-10 w-10 mb-2'/>
                <p className='text-sm font-medium'>Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>

          {accounts.length>0 && accounts?.map((account)=>{
            return <AccountCard key={account.id} account={account}/>
          })}
       </div>
    </div>
  )
}

export default DashboardPage
