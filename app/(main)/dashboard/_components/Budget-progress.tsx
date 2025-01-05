"use client";

import { updateBudget } from "@/actions/budget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/useFetch";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type initialBudgetProps = {
  id: string;
  amount: number;
};
interface BudgetProgressProps {
  initialBudget: initialBudgetProps;
  currentExpenses: number;
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({
  initialBudget,
  currentExpenses,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  console.log(initialBudget, currentExpenses);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || "",
  );

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget?.amount) * 100
    : 0;

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  console.log("", updatedBudget, isLoading);
  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
    }

    await updateBudgetFn(amount);
  };

  useEffect(() => {
    if (updateBudget.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget, isLoading]);

  useEffect(() => {
    if (updateBudget?.error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle>Monthly Budget (Default Account)</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                  placeholder="Enter Amount"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
                  {initialBudget &&
                  typeof currentExpenses === "number" &&
                  typeof initialBudget === "number"
                    ? ` $${currentExpenses.toFixed(
                        2,
                      )} of $${initialBudget?.amount?.toFixed(2)} spent
                  `
                    : "No budget set"}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
