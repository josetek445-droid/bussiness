import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Plus, Clock, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface ExpenseRequest {
  id: string
  description: string
  amount: number
  status: string
  created_at: string
  shop_id: string
  worker_id: string
  // --- Add admin_id to the interface ---
  admin_id: string | null; // Or string if it's always expected after the schema change
}

// Define a type for the admin profile data
interface AdminProfile {
  id: string;
  email: string;
  name?: string; // Admin name might be useful for notifications
}

export function ExpenseRequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<ExpenseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: ''
  })

  useEffect(() => {
    if (user) {
      fetchExpenseRequests()
    }
  }, [user])

  const fetchExpenseRequests = async () => {
    try {
      // Optional: Include admin info if needed for display later
      // const { data, error } = await supabase
      //   .from('expense_requests')
      //   .select(`
      //     *,
      //     admin_profile:profiles!admin_id(name) // Example join
      //   `)
      //   .eq('worker_id', user?.id)
      //   .order('created_at', { ascending: false })

      const { data, error } = await supabase
        .from('expense_requests')
        .select('*')
        .eq('worker_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      console.error('Error fetching expense requests:', error)
      toast({
        title: "Error",
        description: "Failed to load expense requests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to notify the admin (placeholder implementation)
  const notifyAdmin = async (adminProfile: AdminProfile, workerName: string | undefined, requestAmount: number, requestDescription: string) => {
    // --- Placeholder logic remains the same ---
    console.log(`NOTIFICATION: Admin ${adminProfile.email} (${adminProfile.name || 'N/A'}) has a new expense request from ${workerName || 'a worker'} for $${requestAmount}: ${requestDescription}`);
    toast({
        title: "Request Submitted",
        description: `Your request has been sent. Admin notified.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    try {
      // 1. Get user's profile including shop_id, created_by (admin ID), and name
      const { data: workerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('shop_id, created_by, name')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError;
      if (!workerProfile) throw new Error("Worker profile not found.");

      const shopId = workerProfile.shop_id;
      const adminId = workerProfile.created_by; // This is the admin's UUID
      const workerName = workerProfile.name;

      // 2. Insert the expense request, including the admin_id
      const { data: insertedRequest, error: insertError } = await supabase
        .from('expense_requests')
        .insert({
          description: formData.description,
          amount: parseFloat(formData.amount),
          worker_id: user?.id,
          shop_id: shopId,
          // --- Add admin_id to the insert object ---
          admin_id: adminId, // Associate the request with the admin
          status: 'pending'
        })
        .select() // Select the inserted data

      if (insertError) throw insertError;

      // 3. Notify the admin if adminId exists
      let notificationSuccess = false;
      if (adminId) {
        try {
          // Fetch minimal admin details for notification (you might already have email/name if stored differently)
          const { data: adminProfile, error: adminProfileError } = await supabase
            .from('profiles')
            .select('id, email, name') // Select name as well if available
            .eq('id', adminId)
            .single();

          if (adminProfileError) {
            console.error('Error fetching admin profile for notification:', adminProfileError);
          } else if (adminProfile) {
            await notifyAdmin(adminProfile, workerName, parseFloat(formData.amount), formData.description);
            notificationSuccess = true;
          } else {
            console.warn('Admin profile not found for notification ID:', adminId);
          }
        } catch (notifyErr) {
          console.error('Unexpected error during admin notification:', notifyErr);
        }
      } else {
        console.warn('Worker profile does not have a created_by (admin) ID. Request submitted without admin association.');
      }

      toast({
        title: "Success",
        description: "Expense request submitted successfully." + (notificationSuccess ? " Admin notified." : "")
      })

      setFormData({ description: '', amount: '' })
      setIsDialogOpen(false)
      fetchExpenseRequests() // Refresh the list
    } catch (error: any) {
      console.error('Error submitting expense request:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit expense request",
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
    return <div className="flex justify-center p-8">Loading expense requests...</div>
  }

  if (!user) { // Good practice to check if user is actually loaded/available
      return <div className="flex justify-center p-8">Please log in.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expense Requests</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover:scale-105 transition-transform">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Expense Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the expense..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Submit Request
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>${Number(request.amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(request.created_at).toLocaleDateString()}
              </p>
               {/* Example of displaying admin info if fetched */}
               {/* {request.admin_profile?.name && (
                 <p className="text-xs text-muted-foreground mt-1">
                   Assigned Admin: {request.admin_profile.name}
                 </p>
               )} */}
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-200">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Expense Requests</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any expense requests yet.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Submit First Request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}