"use client";

import { bulkDeleteTransactions } from "@/actions/accounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { categoryColors } from "@/data/categories";
import useFetch from "@/hooks/useFetch";
import { compareAsc, format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, MoreHorizontal, RefreshCcw, RefreshCw, Search, Trash, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {BarLoader} from "react-spinners"
import { toast } from "sonner";

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


const RECURRING_INTERVALS= {
  DAILY:"Daily",
  WEEKLY:'Weekly',
  MONTHLY:'Monthly',
  YEARLY:"Yearly"
}

type SortConfig = {
  field: string;
  direction: "asc" | "desc";
};

const ITEMS_PER_PAGE: number=10

const TransactionTable = ({ transactions }:TransactionPageProps) => {
  const router= useRouter()
  const [selectedIds, setSelectedIds] =useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field:'date',
    direction:'desc'
  })

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [recurringFilter, setRecurringFIlter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions)

  const handleBulkDelete = async () => {
    if(!window.confirm(
      `Are your sure you want to delete ${selectedIds.length} transactions?`
    )) {
      return
    };
    deleteFn(selectedIds);
  };

  useEffect(()=>{
    if(deleted && !deleteLoading){
        toast.success("Transactions deleted succcessfully");
      }
      setSelectedIds([])
  },[deleteLoading, deleted])

  const filterAndSortTransations=useMemo(()=>{
    let result=[...transactions];
    
    // applying search filter
    if(searchTerm){
      const searchLower= searchTerm.toLowerCase();
      result= result.filter((transaction)=>
        transaction.description?.toLowerCase().includes(searchLower)
      )
    }

    //recurring filter
    if(recurringFilter){
      result= result.filter((transaction)=>{
        if(recurringFilter==='recurring') return transaction.isRecurring
        return !transaction.isRecurring
      })
    }

    //apply type filter
    if(typeFilter){
      result= result.filter((transaction)=> transaction.type===typeFilter)
    }

    //apply sorting
    result.sort((a,b) => {
      let comparison=0;

      switch(sortConfig.field){
        case "date":
          comparison = new Date(a.date)- new Date(b.date);
          break;
        case "amount":
          comparison = a.amount- b.amount;
          break
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison=0;   
          break     
      }
      return sortConfig.direction ==='desc' ? comparison : -comparison
    })

    return result
  },[ transactions, searchTerm,typeFilter, recurringFilter, sortConfig]);

  const totalPages = Math.ceil(
    filterAndSortTransations.length / ITEMS_PER_PAGE
  );

  const PaginatedTransactions= useMemo(()=>{
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filterAndSortTransations.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  },[filterAndSortTransations, currentPage])

  const handleSort = (field: string) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(current=>
       current.includes(id) 
       ? current.filter(items=> items!==id) 
       : [...current, id]
    )
  };

  const handleSelectAll = () => {
    setSelectedIds(current=>
      current.length === filterAndSortTransations.length 
      ? []
      : filterAndSortTransations.map((trans)=>trans.id)
   )
  };
  
  const handleClearFiters = () => {
    setSearchTerm('')
    setRecurringFIlter('')
    setTypeFilter('')
    setSelectedIds([])
  };
  
  const handlePageChange = (newPage:number) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selections on page change
  };

  
    return (
      <div className="space-y-4">
        {deleteLoading && (
          <BarLoader className='mt-4' width='100%' color="#9333ea" />
        )}
        {/* Filters */}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-8"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e)=> setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder='All types'/>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={recurringFilter} onValueChange={setRecurringFIlter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder='All Transactions'/>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="recurring">Recurring Only</SelectItem>
                <SelectItem value="none-recurring">Non-recurring Only</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.length>0 && 
              <div className="flex items-center gap-2">
                  <Button size={'sm'} onClick={handleBulkDelete} variant={"destructive"}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedIds.length})
                  </Button>
              </div>
            }

            {(searchTerm || typeFilter || recurringFilter) && (
              <Button variant='outline' onClick={handleClearFiters} size='sm' title='Clear Fitlers'>
                <X className="h-4 w-5"/>
              </Button>
            )}
          </div>
        </div>
  
        {/* Transactions */}
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    onCheckedChange={handleSelectAll}
                    checked={
                      selectedIds.length===
                      filterAndSortTransations.length && filterAndSortTransations.length>0
                    }
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date 
                    {sortConfig.field ==='date' &&
                     (sortConfig.direction ==='asc' ? (
                     <ChevronUp className="ml-1 h-4 w-4" />
                     ):( 
                     <ChevronDown className="ml-1 h-4 w-4"/>
                    ))} 
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    {sortConfig.field ==='category' &&
                     (sortConfig.direction ==='asc' ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                     ):( 
                      <ChevronDown className="ml-1 h-4 w-4"/>
                    ))}   
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end">
                    Amount
                    {sortConfig.field ==='amount' &&
                     (sortConfig.direction ==='asc' ? (
                     <ChevronUp className="ml-1 h-4 w-4" />
                     ):( 
                     <ChevronDown className="ml-1 h-4 w-4"/>
                    ))}   
                  </div>
                </TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {PaginatedTransactions.length===0?
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow> 
              :
              (
                PaginatedTransactions.map((transaction)=>{
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          onCheckedChange={()=>handleSelect(transaction.id)}
                          checked={selectedIds.includes(transaction.id)}
                        />
                      </TableCell>

                      <TableCell>
                        {format(new Date(transaction.date), 'PP')}
                      </TableCell>

                      <TableCell>{transaction.description}</TableCell>

                      <TableCell className="capitalize">
                        <span
                          style={{
                            background: categoryColors[transaction.category]
                          }}
                          className="px-2 py-1 rounded text-white text-sm"
                        >
                          {transaction.category}
                        </span>
                      </TableCell>

                      <TableCell 
                        className="text-right font-medium" 
                        style={{color:transaction.type==='EXPENSE'?'red':'green'}}
                      >
                        {transaction.type==='EXPENSE' ? "-":"+"}
                        $ {transaction.amount.toFixed(2)}
                      </TableCell>

                      <TableCell 
                      >
                        {transaction.isRecurring?
                        (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant="secondary"
                                  className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  {
                                    RECURRING_INTERVALS[
                                      transaction.recurringInterval
                                    ]
                                  }
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <div className="font-medium">Next Date:</div>
                                  <div>
                                  {transaction.nextRecurringDate 
                                    ? format(new Date(transaction.nextRecurringDate), "PPP") 
                                  : "N/A"}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ):(
                          <Badge variant="outline" className="gap-1">
                            <Clock className='h-3 w-3'/>
                            One-time
                          </Badge>
                        )}
                        
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent>
                            <DropdownMenuSeparator/>

                            <DropdownMenuItem
                              onClick={()=>{
                                router.push(
                                  `/transaction/create?edit=${transaction.id}`
                                )
                              }}
                            >
                              Edit 
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={()=>deleteFn([transaction.id])}
                            >
                              Delete 
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )

                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      </div>
    );
  };
  
  export default TransactionTable;
  