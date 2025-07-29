import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, DollarSign, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ExpenseTrackerProps {
  eventId: number;
}

export default function ExpenseTracker({ eventId }: ExpenseTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/expenses`],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/expenses`, expenseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/expenses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      toast({
        title: "Expense added!",
        description: "Your expense has been recorded.",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add expenses.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim() || !amount.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both description and amount.",
        variant: "destructive",
      });
      return;
    }

    // For this demo, we'll split among all going guests
    // In a real app, you'd allow users to select who to split with
    createExpenseMutation.mutate({
      description,
      amount: parseFloat(amount),
      category,
      splitAmong: [user.id], // Simplified for demo
    });
  };

  const calculateTotal = () => {
    return expenses.reduce((total: number, expense: any) => total + parseFloat(expense.amount), 0);
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gaming-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Pizza & Drinks"
                  className="bg-dark-card border-dark-border"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="120.00"
                  className="bg-dark-card border-dark-border"
                />
              </div>
              <div>
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Food & Drinks"
                  className="bg-dark-card border-dark-border"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full gaming-button"
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {expenses.map((expense: any) => (
          <div key={expense.id} className="flex items-center justify-between p-3 bg-dark-card rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={expense.payer?.profileImageUrl} />
                <AvatarFallback>
                  {expense.payer?.firstName?.[0]}{expense.payer?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  Paid by {expense.payer?.firstName} {expense.payer?.lastName}
                  {expense.category && ` • ${expense.category}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
              <p className="text-xs text-green-400">Paid</p>
            </div>
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No expenses yet</p>
            <p className="text-sm">Add the first expense to start tracking costs</p>
          </div>
        )}
      </div>

      {expenses.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-lg border border-primary/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Expenses:</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
          </div>
          {user && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Your estimated share:</span>
              <span className="font-semibold text-cyan-400">
                {formatCurrency(calculateTotal() / Math.max(expenses.length, 1))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
