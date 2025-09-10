// src/components/admin/expense-management.tsx
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, Plus, DollarSign, Clock, CheckCircle, XCircle, Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface ExpenseRequest {
  id: string
  description: string
  amount: number
  status: string
  created_at: string
  worker_id: string
  // --- Updated type for the joined worker ---
  workers?: { name: string }
}

interface Worker {
  id: string
  name: string
  shop_id: string
  // Add created_by if it exists in your workers table and is needed
  // created_by: string;
}

interface SalaryPayment {
  id: string;
  worker_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  // --- Updated type for the joined worker ---
  workers?: { name: string };
}

export function ExpenseManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentData, setPaymentData] = useState({
    worker_id: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    if (user?.id) {
      fetchData()
    } else if (user === null) {
      setLoading(false);
    }
  }, [user?.id])

  useEffect(() => {
    if (activeTab === "payments" && user?.id) {
        fetchSalaryPayments();
    }
  }, [activeTab, user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // --- Fetch workers created by THIS admin ---
      // --- FIX 1: Query the 'workers' table ---
      const { data: workersData, error: workersError } = await supabase
        .from('workers') // <-- Changed from 'profiles' to 'workers'
        .select('id, name, shop_id')
        // --- Adjust or remove the role filter if not applicable to 'workers' table ---
        // .eq('role', 'worker') // <-- Remove if 'workers' table only has workers
        .eq('created_by', user.id); // Assuming 'created_by' links worker to admin

      if (workersError) {
        console.error('Error fetching workers:', workersError);
        throw workersError;
      }

      const workerIds = workersData?.map(worker => worker.id) || [];
      setWorkers(workersData || []);

      // --- Fetch expense requests for workers created by THIS admin ---
      let requestsData: ExpenseRequest[] = [];
      if (workerIds.length > 0) {
        const { data: requests, error: requestsError } = await supabase
          .from('expense_requests')
          .select(`
            *,
            workers!worker_id (name) // <-- Corrected: Removed comment, only query part
          `)
          .in('worker_id', workerIds)
          .order('created_at', { ascending: false });

        if (requestsError) {
           console.error('Error fetching expense requests:', requestsError);
           throw requestsError;
        }
        requestsData = requests || [];
      }
      setExpenseRequests(requestsData);

    } catch (error: any) {
      console.error('Error fetching ', error);
      toast({
        title: "Error",
        description: `Failed to load  ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryPayments = async () => {
    if (!user?.id) return;

    try {
      // --- Fetch workers created by THIS admin ---
      // --- FIX 1: Query the 'workers' table ---
      const { data: adminWorkers, error: workersError } = await supabase
        .from('workers') // <-- Changed from 'profiles' to 'workers'
        .select('id')
        // --- Adjust or remove the role filter if not applicable to 'workers' table ---
        // .eq('role', 'worker'); // <-- Remove if 'workers' table only has workers
        .eq('created_by', user.id); // Assuming 'created_by' links worker to admin

      if (workersError) {
         console.error('Error fetching workers for salary payments:', workersError);
         throw workersError;
      }

      const workerIds = adminWorkers?.map(w => w.id) || [];

      if (workerIds.length === 0) {
          setSalaryPayments([]);
          return;
      }

      // --- Fetch salary payments for those workers, joining with workers table for name ---
      const { data: payments, error: paymentsError } = await supabase
        .from('salary_payments')
        .select(`
          *,
          workers!worker_id (name) // <-- Corrected: Removed comment, only query part
        `)
        .in('worker_id', workerIds)
        .order('created_at', { ascending: false });

      if (paymentsError) {
         console.error('Error fetching salary payments:', paymentsError);
         throw paymentsError;
      }

      setSalaryPayments(payments || []);
    } catch (error: any) {
      console.error('Error fetching salary payments:', error);
      toast({
        title: "Error",
        description: `Failed to load salary payments: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };


  const handleRequestStatusUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('expense_requests')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Request ${status} successfully`
      })
      fetchData() // Refresh the list after update
    } catch (error: any) {
      console.error('Error updating request status:', error)
      toast({
        title: "Error",
        description: `Failed to update request status: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const handleSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentData.worker_id || !paymentData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('salary_payments')
        .insert({
          worker_id: paymentData.worker_id,
          amount: parseFloat(paymentData.amount),
          month: paymentData.month,
          year: paymentData.year
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Salary payment recorded successfully"
      })

      setPaymentData({
        worker_id: '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      })
      setIsPaymentDialogOpen(false)
      if (activeTab === "payments") {
          fetchSalaryPayments();
      }
    } catch (error: any) {
      console.error('Error recording salary payment:', error)
      toast({
        title: "Error",
        description: `Failed to record salary payment: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading expense management...</div>
  }

  if (!user?.id) {
    return <div className="flex justify-center p-8">Please log in as an admin to access this page.</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600
                       dark:from-purple-400 dark:to-pink-400">
          Expense & Salary Management
        </h1>
        
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg gap-2
                               dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Record Payment</span>
              <span className="sm:hidden">Pay</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-md bg-white rounded-xl shadow-2xl
                                   dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-gray-800
                                     dark:text-gray-100">
                Record Salary Payment
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSalaryPayment} className="space-y-4 pr-4">
              <div>
                <Label htmlFor="worker" className="text-gray-700
                                                   dark:text-gray-200">Worker</Label>
                <Select
                  value={paymentData.worker_id}
                  onValueChange={(value) => setPaymentData({ ...paymentData, worker_id: value })}
                  required
                >
                  <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                           dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {workers.length > 0 ? (
                      workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id} className="dark:hover:bg-gray-700">
                          {worker.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled className="dark:hover:bg-gray-700">
                        No workers found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount" className="text-gray-700
                                                   dark:text-gray-200">Amount (KSh)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder="Enter payment amount"
                  required
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                             dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month" className="text-gray-700
                                                    dark:text-gray-200">Month</Label>
                  <Select value={paymentData.month.toString()} onValueChange={(value) => setPaymentData({ ...paymentData, month: parseInt(value) })}>
                    <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                             dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()} className="dark:hover:bg-gray-700">
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year" className="text-gray-700
                                                   dark:text-gray-200">Year</Label>
                  <Select value={paymentData.year.toString()} onValueChange={(value) => setPaymentData({ ...paymentData, year: parseInt(value) })}>
                    <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                             dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return (
                          <SelectItem key={year} value={year.toString()} className="dark:hover:bg-gray-700">
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md
                             dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                >
                  Record Payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50
                             dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests" className="w-full" onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-2 min-w-fit bg-white/80 backdrop-blur-sm shadow-md rounded-lg p-1
                              dark:bg-gray-800/80">
            <TabsTrigger
              value="requests"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md transition-all
                         dark:data-[state=active]:from-purple-600 dark:data-[state=active]:to-pink-600"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Expense Requests</span>
              <span className="sm:hidden">Requests</span>
              <span className="ml-1 bg-purple-200 text-purple-800 text-xs px-1.5 py-0.5 rounded-full dark:bg-purple-900/50 dark:text-purple-300">
                {expenseRequests.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-md transition-all
                         dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-indigo-600"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Salary Payments</span>
              <span className="sm:hidden">Payments</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="requests" className="space-y-4 mt-4">
          {expenseRequests.length > 0 ? (
            expenseRequests.map((request) => (
              <Card
                key={request.id}
                className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-0 hover:shadow-2xl transition-all duration-300
                           dark:bg-gray-800/80 dark:border-gray-700"
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl
                                      dark:from-purple-600 dark:to-pink-600">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      <span>{request.workers?.name || 'Unknown Worker'}</span>
                      <span className="font-normal text-purple-100 dark:text-purple-200">
                        - KSh {Number(request.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4
                               dark:text-gray-400">
                    {request.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs text-muted-foreground
                                 dark:text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestStatusUpdate(request.id, 'approved')}
                          className="border-2 border-green-300 text-green-700 hover:bg-green-50
                                     dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestStatusUpdate(request.id, 'rejected')}
                          className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50
                                     dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0 text-center p-8 hover:shadow-2xl transition-shadow duration-200
                             dark:bg-gray-800/80 dark:border-gray-700">
              <CardContent>
                <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                                dark:bg-purple-900/50">
                  <Wallet className="h-8 w-8 text-purple-600
                                   dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1
                               dark:text-gray-100">
                  No Expense Requests
                </h3>
                <p className="text-gray-500
                             dark:text-gray-400">
                  No expense requests have been submitted by your workers yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0 hover:shadow-2xl transition-shadow duration-200
                           dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-2xl
                                  dark:from-blue-600 dark:to-indigo-600">
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="h-5 w-5" />
                Recent Salary Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {salaryPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50 hover:bg-blue-50
                                          dark:bg-gray-700 dark:hover:bg-gray-700">
                        <TableHead className="text-blue-700 font-semibold
                                             dark:text-blue-300">Worker</TableHead>
                        <TableHead className="text-blue-700 font-semibold
                                             dark:text-blue-300">Amount (KSh)</TableHead>
                        <TableHead className="text-blue-700 font-semibold
                                             dark:text-blue-300">Period</TableHead>
                        <TableHead className="text-blue-700 font-semibold
                                             dark:text-blue-300">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryPayments.map((payment) => (
                        <TableRow
                          key={payment.id}
                          className="hover:bg-blue-50 transition-colors border-b border-blue-100
                                     dark:hover:bg-gray-700 dark:border-gray-700"
                        >
                          <TableCell className="font-medium
                                               dark:text-gray-200">
                            {payment.workers?.name || 'Unknown Worker'}
                          </TableCell>
                          <TableCell className="font-medium
                                               dark:text-gray-200">
                            {Number(payment.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-muted-foreground
                                               dark:text-gray-400">
                            {new Date(payment.year, payment.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-muted-foreground
                                               dark:text-gray-400">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                                  dark:bg-blue-900/50">
                    <DollarSign className="h-8 w-8 text-blue-600
                                         dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1
                                 dark:text-gray-100">
                    No Salary Payments
                  </h3>
                  <p className="text-gray-500
                               dark:text-gray-400">
                    No salary payments have been recorded yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}