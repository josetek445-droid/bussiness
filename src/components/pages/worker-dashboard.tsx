// src/components/pages/worker-dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MakeSaleDialog } from "@/components/sales/make-sale-dialog";
// --- Import necessary components for Expense Requests ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// --- ---
import {
  ShoppingCart,
  BarChart3,
  History,
  DollarSign,
  TrendingUp,
  Package,
  Plus,
  Store,
  AlertCircle,
  LogOut,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

interface WorkerSession {
  id: string;
  name: string;
  email: string;
  role: string;
  shop_id: string | null;
}

interface WorkerStats {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  totalEarnings: number;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  minimum_selling_price: number;
  shop_id: string;
}

interface ExpenseRequest {
  id: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
  shop_id: string;
  worker_id: string;
  // Note: admin_id removed from interface and insert as it causes PGRST204
}

const WORKER_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

const WorkerDashboard: React.FC = () => {
  const { workerSession, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  // --- Add 'requests' to the type definition for activeTab ---
  const [activeTab, setActiveTab] = useState<"sales" | "stats" | "history" | "requests">("sales");
  // --- ---
  const [stats, setStats] = useState<WorkerStats>({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalEarnings: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [showMakeSale, setShowMakeSale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedShop, setAssignedShop] = useState<{ id: string; name: string } | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [isShopDataLoading, setIsShopDataLoading] = useState(false);

  // --- Expense Request States ---
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: ''
  });
  // --- ---

  // --- Update the tabs array to include the new Requests tab ---
  const tabs = [
    { id: "sales", label: "Make Sale", icon: ShoppingCart },
    { id: "stats", label: "My Statistics", icon: BarChart3 },
    { id: "history", label: "Sales History", icon: History },
    // --- Add Requests Tab ---
    { id: "requests", label: "Requests", icon: FileText },
    // --- ---
  ];
  // --- ---

  useEffect(() => {
    if (!authLoading && !workerSession) {
      console.log("No worker session, redirecting to login.");
      navigate("/login");
    }
  }, [workerSession, authLoading, navigate]);

  useEffect(() => {
    const fetchWorkerShopData = async () => {
      if (!workerSession?.id) {
        console.error("Worker session not available or missing ID");
        setIsShopDataLoading(false);
        return;
      }
      setIsShopDataLoading(true);
      try {
        // 1. Get the shop_id assigned to the worker
        const shopId = workerSession.shop_id;
        // 2. If no shop_id, worker is not assigned
        if (!shopId) {
          console.log("Worker is not assigned to a shop (shop_id is null)");
          setAssignedShop(null);
          setShopProducts([]);
          setIsShopDataLoading(false);
          return;
        }
        // 3. Fetch the specific shop details using the shop_id
        console.log(`Fetching shop details for shop_id: ${shopId}`);
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("id, name")
          .eq("id", shopId) // Fetch the specific shop
          .maybeSingle(); // Use maybeSingle in case the shop doesn't exist

        if (shopError) {
          console.error("Error fetching shop details:", shopError);
          toast.error("Failed to load assigned shop details.");
          setAssignedShop(null);
          setShopProducts([]);
          setIsShopDataLoading(false);
          return; // Stop if shop fetch fails
        }
        if (!shopData) {
          console.warn(`No shop found with ID: ${shopId}`);
          setAssignedShop(null);
          setShopProducts([]);
          setIsShopDataLoading(false);
          return;
        }
        // 4. If shop found, set it
        console.log("Shop details fetched:", shopData);
        setAssignedShop(shopData);
        // 5. Fetch products belonging to this specific shop that have stock
        console.log(`Fetching products for shop_id: ${shopData.id}`);
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select(`
            id,
            name,
            stock,
            minimum_selling_price,
            shop_id
          `)
          .eq("shop_id", shopData.id) // Filter by the assigned shop
          .gt("stock", 0); // Only fetch products with stock > 0
        if (productsError) {
          console.error("Error fetching products for shop:", productsError);
          toast.error("Failed to load products for your shop.");
          // Keep the shop assigned, but products list empty
          setShopProducts([]);
        } else {
          console.log(`Fetched ${products?.length || 0} products for the shop.`);
          setShopProducts(products || []);
        }
      } catch (error: any) {
        console.error("Unexpected error in fetchWorkerShopData:", error);
        toast.error(`An unexpected error occurred: ${error.message || "Unknown error"}`);
        setAssignedShop(null);
        setShopProducts([]);
      } finally {
        setIsShopDataLoading(false);
      }
    };

    // Only run this effect if workerSession is loaded and has an ID
    if (workerSession?.id) {
      console.log("Worker session ID found, fetching shop data...");
      fetchWorkerShopData();
    } else if (workerSession !== null && !workerSession?.id) {
      // workerSession object exists but ID is missing (edge case)
      console.error("Worker session object found but ID is missing");
      setIsShopDataLoading(false);
    }
    // If workerSession is null, the redirect useEffect should handle it
  }, [workerSession?.id, workerSession?.shop_id]); // Re-run if ID or shop_id changes

  // --- Fetch Expense Requests Effect ---
  useEffect(() => {
    if (workerSession?.id) {
      fetchExpenseRequests();
    }
  }, [workerSession?.id]);
  // --- ---

  useEffect(() => {
    const fetchWorkerData = async () => {
      // Ensure workerSession is loaded
      if (!workerSession?.id) {
        console.log("Worker ID not available yet for fetching stats/sales");
        return;
      }
      console.log("Fetching worker stats and sales data...");
      setIsLoading(true); // Set loading state for stats/sales
      try {
        // Fetch worker's sales
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select(`
            *,
            products (name)
          `)
          .eq("worker_id", workerSession.id) // Filter sales by this worker
          .order("created_at", { ascending: false });
        if (salesError) throw salesError;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const todaySales = salesData
          ?.filter((sale) => new Date(sale.created_at) >= today)
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const weekSales = salesData
          ?.filter((sale) => new Date(sale.created_at) >= weekAgo)
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const monthSales = salesData
          ?.filter((sale) => new Date(sale.created_at) >= monthAgo)
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        // Fetch salary payments
        const { data: salaryPayments, error: salaryError } = await supabase
          .from("salary_payments")
          .select("amount")
          .eq("worker_id", workerSession.id); // Filter payments by this worker
        if (salaryError) throw salaryError;
        const totalEarnings =
          salaryPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        setStats({
          todaySales,
          weekSales,
          monthSales,
          totalEarnings,
        });
        setRecentSales(salesData?.slice(0, 10) || []);
        // Prepare pie chart data for sales distribution
        const salesPieData = [
          { name: "Today", value: todaySales, color: WORKER_COLORS[0] },
          { name: "This Week", value: weekSales - todaySales, color: WORKER_COLORS[1] },
          { name: "This Month", value: monthSales - weekSales, color: WORKER_COLORS[2] },
        ].filter((item) => item.value > 0); // Only show segments with data
        setPieData(salesPieData);
      } catch (error: any) {
        console.error("Error fetching worker data (stats/sales):", error);
        toast.error(`Failed to load dashboard data: ${error.message || "Unknown error"}`);
      } finally {
        setIsLoading(false); // Done loading stats/sales
      }
    };
    if (workerSession?.id) {
      fetchWorkerData();
    }
  }, [workerSession?.id]); // Re-run when worker ID is available/changes

  // --- Expense Request Functions ---
  const fetchExpenseRequests = async () => {
    if (!workerSession?.id) return;
    setIsRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from('expense_requests')
        .select('*')
        .eq('worker_id', workerSession.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching expense requests:', error);
      toastHook({
        title: "Error",
        description: "Failed to load expense requests",
        variant: "destructive"
      });
    } finally {
      setIsRequestsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      toastHook({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!workerSession?.id) {
        toastHook({
            title: "Error",
            description: "User session not found.",
            variant: "destructive"
        });
        return;
    }

    try {
      // 1. Get worker's details including shop_id and created_by (admin ID)
      // --- FIX: Query the 'workers' table instead of 'profiles' ---
      const { data: workerData, error: workerError } = await supabase
        .from('workers') // <-- Correct table
        .select('shop_id, created_by, name') // Ensure these columns exist
        .eq('id', workerSession.id) // Use workerSession.id
        .maybeSingle(); // Use maybeSingle() for safety

      // --- Check for errors from the worker query ---
      if (workerError) {
         console.error('Error fetching worker data:', workerError);
         toastHook({
           title: "Error",
           description: `Database error fetching worker data: ${workerError.message}`,
           variant: "destructive"
         });
         return;
      }

      // --- Check if the worker data was actually found ---
      if (!workerData) {
        console.warn('No worker data found for worker ID:', workerSession.id);
        toastHook({
          title: "Error",
          description: "Worker information not found. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // If data is found, proceed
      const shopId = workerData.shop_id;
      const adminId = workerData.created_by; // Fetched for potential use (e.g., notifications)
      const workerName = workerData.name || 'Unknown Worker';

      // 2. Insert the expense request (WITHOUT admin_id to prevent PGRST204)
      const { data: insertedRequest, error: insertError } = await supabase
        .from('expense_requests')
        .insert({
          description: formData.description,
          amount: parseFloat(formData.amount),
          worker_id: workerSession.id, // Associate with the worker
          shop_id: shopId, // Associate with the worker's shop
          // --- admin_id REMOVED to prevent PGRST204 error ---
          // admin_id: adminId,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (insertError) {
         console.error('Error inserting expense request:', insertError);
         toastHook({
           title: "Error",
           description: `Failed to submit request: ${insertError.message}`,
           variant: "destructive"
         });
         return;
      }

      // 3. Notify the admin if adminId exists (Placeholder logic)
      // You can still use the fetched adminId here for notifications.
      let notificationSuccess = false;
      if (adminId) {
        try {
          // Example: Fetch admin details for notification (assuming admins are in 'workers')
          const { data: adminData, error: adminError } = await supabase
            .from('workers')
            .select('id, email, name')
            .eq('id', adminId)
            .maybeSingle();

          if (adminError) {
            console.error('Error fetching admin data for notification:', adminError);
          } else if (adminData) {
            // Placeholder notification logic (replace with actual service)
            console.log(`NOTIFICATION: Admin ${adminData.email} (${adminData.name || 'N/A'}) has a new expense request from ${workerName} for $${parseFloat(formData.amount)}: ${formData.description}`);
            toastHook({
                title: "Request Submitted",
                description: `Your request has been sent. Admin notified.`,
            });
            notificationSuccess = true;
          } else {
            console.warn('Admin data not found for notification ID:', adminId);
          }
        } catch (notifyErr: any) {
          console.error('Unexpected error during admin notification:', notifyErr);
        }
      } else {
        console.warn('Worker data does not have a created_by (admin) ID. Request submitted without admin association.');
      }

      // Success Toast
      toastHook({
        title: "Success",
        description: "Expense request submitted successfully." + (notificationSuccess ? " Admin notified." : ""),
      });

      // Reset form and close dialog
      setFormData({ description: '', amount: '' });
      setIsDialogOpen(false);
      fetchExpenseRequests(); // Refresh the list of requests

    } catch (error: any) {
      console.error('Unexpected error submitting expense request:', error);
      toastHook({
        title: "Error",
        description: error.message || "An unexpected error occurred while submitting the request.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };
  // --- ---

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("You have been logged out successfully");
      navigate("/login"); // Adjust path as needed
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out. Please try again.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "sales":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Make a Sale</h2>
                <p className="text-muted-foreground">Process customer transactions</p>
              </div>
              <div className="flex items-center gap-2">
                {isShopDataLoading ? (
                  <span className="text-sm text-muted-foreground">Loading shop info...</span>
                ) : assignedShop ? (
                  <div className="flex items-center text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                    <Store className="h-4 w-4 mr-1" />
                    {assignedShop.name}
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No Shop Assigned
                  </div>
                )}
                <Button
                  onClick={() => {
                    if (!assignedShop) {
                      toast.warning("You are not assigned to a shop. Sales cannot be made.");
                      return;
                    }
                    if (shopProducts.length === 0) {
                      toast.info("No products available in your assigned shop.");
                      return;
                    }
                    setShowMakeSale(true);
                  }}
                  disabled={!assignedShop || shopProducts.length === 0 || isShopDataLoading}
                  className="gradient-primary gap-2 hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Make a Sale</span>
                  <span className="sm:hidden">Sale</span>
                </Button>
              </div>
            </div>
            {!assignedShop ? (
              <Card className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Shop Assignment</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    You are currently not assigned to any shop. Please contact your administrator to get assigned.
                  </p>
                </CardContent>
              </Card>
            ) : shopProducts.length === 0 ? (
              <Card className="border border-muted bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Products Available</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    There are currently no products in your assigned shop (<strong>{assignedShop.name}</strong>) or they are out of stock.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-muted bg-card hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Quick Sale Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Follow these steps to make a sale in <strong>{assignedShop.name}</strong>:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10">
                      <div className="text-primary font-bold text-lg mb-2">1</div>
                      <h4 className="font-medium text-foreground">Select Product</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose from the {shopProducts.length} available items.
                      </p>
                    </div>
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10">
                      <div className="text-primary font-bold text-lg mb-2">2</div>
                      <h4 className="font-medium text-foreground">Set Quantity</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter the number of items the customer wants.
                      </p>
                    </div>
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10">
                      <div className="text-primary font-bold text-lg mb-2">3</div>
                      <h4 className="font-medium text-foreground">Complete Sale</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Confirm the transaction and receive payment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "stats":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="hover:shadow-md transition-shadow duration-200">
                <MetricCard
                  title="Today's Sales"
                  value={`KSh ${stats.todaySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  description="Sales made today"
                  icon={DollarSign}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800"
                />
              </div>
              <div className="hover:shadow-md transition-shadow duration-200">
                <MetricCard
                  title="This Week"
                  value={`KSh ${stats.weekSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  description="Sales this week"
                  icon={ShoppingCart}
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800"
                />
              </div>
              <div className="hover:shadow-md transition-shadow duration-200">
                <MetricCard
                  title="This Month"
                  value={`KSh ${stats.monthSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  description="Sales this month"
                  icon={TrendingUp}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800"
                />
              </div>
              <div className="hover:shadow-md transition-shadow duration-200">
                <MetricCard
                  title="Total Earnings"
                  value={`KSh ${stats.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  description="Salary received"
                  icon={Package}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800"
                />
              </div>
            </div>
            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-muted bg-card hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Sales Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={WORKER_COLORS[index % WORKER_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `KSh ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                            "Amount",
                          ]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            boxShadow:
                              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                      <p>No sales data available for chart</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border border-muted bg-card hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Daily Average (Est.)
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          KSh{" "}
                          {stats.monthSales > 0
                            ? Math.round(stats.monthSales / 30).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                            : "0"}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-green-200 dark:bg-green-700/50 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.monthSales > 0 && stats.monthSales / 30 > 0
                                ? Math.min(
                                  (stats.todaySales / (stats.monthSales / 30)) * 100,
                                  100
                                )
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        {stats.todaySales > 0 && stats.monthSales > 0
                          ? `You've made ${(
                            (stats.todaySales / (stats.monthSales / 30)) *
                            100
                          ).toFixed(0)}% of your daily average.`
                          : "Make a sale to see your progress."}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Weekly Progress
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          {stats.monthSales > 0
                            ? ((stats.weekSales / stats.monthSales) * 100).toFixed(0)
                            : "0"}
                          %
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 dark:bg-blue-700/50 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.monthSales > 0 ? (stats.weekSales / stats.monthSales) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        {stats.monthSales > 0
                          ? `You've achieved ${(
                            (stats.weekSales / stats.monthSales) *
                            100
                          ).toFixed(0)}% of your monthly target.`
                          : "Sales this month will appear here."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "history":
        return (
          <Card className="border border-muted bg-card hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <History className="h-5 w-5 text-purple-500" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-full flex items-center justify-center border border-purple-200 dark:border-purple-800">
                    <ShoppingCart className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No Sales Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your sales history will appear here once you make transactions.
                  </p>
                  <Button
                    onClick={() => {
                      if (!assignedShop) {
                        toast.warning("You are not assigned to a shop. Sales cannot be made.");
                        return;
                      }
                      if (shopProducts.length === 0) {
                        toast.info("No products available in your assigned shop.");
                        return;
                      }
                      setShowMakeSale(true);
                    }}
                    disabled={
                      !assignedShop || shopProducts.length === 0 || isShopDataLoading
                    }
                    className="gradient-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Make Your First Sale
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {recentSales.map((sale, index) => (
                    <div
                      key={sale.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                        index % 4 === 0
                          ? "bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/10 border-green-200 dark:border-green-800"
                          : index % 4 === 1
                            ? "bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/10 border-blue-200 dark:border-blue-800"
                            : index % 4 === 2
                              ? "bg-gradient-to-r from-purple-50/50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10 border-purple-200 dark:border-purple-800"
                              : "bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-800/10 border-orange-200 dark:border-orange-800"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            index % 4 === 0
                              ? "text-green-800 dark:text-green-200"
                              : index % 4 === 1
                                ? "text-blue-800 dark:text-blue-200"
                                : index % 4 === 2
                                  ? "text-purple-800 dark:text-purple-200"
                                  : "text-orange-800 dark:text-orange-200"
                          }`}
                        >
                          {sale.products?.name || "Unknown Product"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`${
                              index % 4 === 0
                                ? "text-green-600 dark:text-green-400"
                                : index % 4 === 1
                                  ? "text-blue-600 dark:text-blue-400"
                                  : index % 4 === 2
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            Qty: {sale.quantity} × KSh{" "}
                            {Number(sale.selling_price).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString()}{" "}
                            {new Date(sale.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <span className="font-semibold text-green-600 dark:text-green-400 text-lg block">
                          KSh{" "}
                          {Number(sale.total_amount).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          +KSh{" "}
                          {Number(sale.profit).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          Profit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
        // --- Add case for 'requests' tab ---
        case "requests":
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

              {/* Loading Indicator for Requests */}
              {isRequestsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          );
        // --- ---
      default:
        return null;
    }
  };

  // Show loading state while checking auth or initial data load
  if (authLoading || isLoading || !workerSession) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Worker Dashboard
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
              <p className="text-muted-foreground">
                Welcome back, <span className="font-semibold">{workerSession?.name}</span>!
              </p>
              {assignedShop && (
                <div className="flex items-center text-xs sm:text-sm bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full max-w-fit">
                  <Store className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                  <span className="truncate">Shop: {assignedShop.name}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      <div className="mb-6">
        <nav className="flex flex-wrap gap-1 bg-secondary/50 dark:bg-secondary/30 rounded-lg p-1 shadow-sm border border-muted">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} // Type assertion
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-[120px] justify-center ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="transition-all duration-300 ease-in-out">{renderTabContent()}</div>
      {/* Pass shop-specific products and worker ID to the dialog */}
      <MakeSaleDialog
        open={showMakeSale}
        onOpenChange={(open) => {
          setShowMakeSale(open);
          if (!open) {
            // Optionally refresh stats/sales history when dialog closes
             const fetchWorkerData = async () => {
                if (workerSession?.id) {
                    // Re-fetch stats and recent sales
                    const { data: salesData, error: salesError } = await supabase
                      .from('sales')
                      .select(`
                        *,
                        products (name)
                      `)
                      .eq('worker_id', workerSession.id)
                      .order('created_at', { ascending: false });
                    if (!salesError) {
                      const now = new Date();
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      const todaySales = salesData?.filter(sale =>
                        new Date(sale.created_at) >= today
                      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
                      const weekSales = salesData?.filter(sale =>
                        new Date(sale.created_at) >= weekAgo
                      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
                      const monthSales = salesData?.filter(sale =>
                        new Date(sale.created_at) >= monthAgo
                      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
                      setStats(prev => ({
                        ...prev,
                        todaySales,
                        weekSales,
                        monthSales
                      }));
                      setRecentSales(salesData?.slice(0, 10) || []);
                    }
                    // Optionally, re-fetch products if stock might have changed
                    // This might be overkill for every dialog close, consider only after successful sale
                    // fetchWorkerShopData();
                }
            };
            fetchWorkerData();
          }
        }}
        onSaleComplete={() => {
             // Specifically refresh data after a successful sale
             console.log("Sale completed, refreshing dashboard data...");
             // Re-fetch stats, sales, and potentially products
             const fetchWorkerData = async () => {
                if (workerSession?.id) {
                    const { data: salesData, error: salesError } = await supabase
                      .from('sales')
                      .select(`
                        *,
                        products (name)
                      `)
                      .eq('worker_id', workerSession.id)
                      .order('created_at', { ascending: false });
                    if (!salesError) {
                      const now = new Date();
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      const todaySales = salesData?.filter(sale =>
                        new Date(sale.created_at) >= today
                      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
                      const weekSales = salesData?.filter(sale =>
                        new Date(sale.created_at) >= weekAgo
                      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
                      const monthSales = salesData?.filter(sale =>
                        new Date(sale.created_at) >= monthAgo
                      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
                      // Fetch salary payments again for total earnings
                       const { data: salaryPayments, error: salaryError } = await supabase
                        .from('salary_payments')
                        .select('amount')
                        .eq('worker_id', workerSession.id);
                      const totalEarnings = !salaryError ? (salaryPayments?.reduce((sum, payment) =>
                        sum + Number(payment.amount), 0) || 0) : 0; // Keep old value if error
                      setStats({
                        todaySales,
                        weekSales,
                        monthSales,
                        totalEarnings // Update total earnings
                      });
                      setRecentSales(salesData?.slice(0, 10) || []);
                      // Update Pie Chart
                      const salesPieData = [
                        { name: 'Today', value: todaySales, color: WORKER_COLORS[0] },
                        { name: 'This Week', value: weekSales - todaySales, color: WORKER_COLORS[1] },
                        { name: 'This Month', value: monthSales - weekSales, color: WORKER_COLORS[2] },
                      ].filter(item => item.value > 0);
                      setPieData(salesPieData);
                    }
                    // Re-fetch products to reflect potential stock changes
                     const shopId = workerSession.shop_id;
                     if (shopId) {
                         const { data: products, error: productsError } = await supabase
                          .from('products')
                          .select(`id, name, stock, minimum_selling_price, shop_id`)
                          .eq('shop_id', shopId)
                          .gt('stock', 0);
                         if (!productsError) {
                              setShopProducts(products || []);
                         } else {
                             console.error("Error re-fetching products after sale:", productsError);
                         }
                     }
                }
            };
            fetchWorkerData();
         }}
        availableProducts={shopProducts} // Pass the products fetched for the assigned shop
        workerShopId={assignedShop?.id || null} // Pass the shop ID for validation if needed
        workerId={workerSession.id} // Pass worker ID if needed by the dialog
      />
    </div>
  );
};

export default WorkerDashboard;