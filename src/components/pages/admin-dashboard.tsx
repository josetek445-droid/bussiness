// src/components/admin/admin-dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Store,
  Trophy,
  ArrowDown,
  Clock,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  totalProducts: number;
  lowStock: number;
  totalShops: number;
  totalWorkers: number;
  monthlyGrowth: number;
}

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalProfit: 0,
    totalProducts: 0,
    lowStock: 0,
    totalShops: 0,
    totalWorkers: 0,
    monthlyGrowth: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [productStockData, setProductStockData] = useState<any[]>([]);
  const [bestProduct, setBestProduct] = useState<any | null>(null);
  const [worstProduct, setWorstProduct] = useState<any | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Notifications
  const [productNotifications, setProductNotifications] = useState(0);
  const [workerNotifications, setWorkerNotifications] = useState(0);
  const [productOverviewData, setProductOverviewData] = useState<any[]>([]);
  const [workerOverviewData, setWorkerOverviewData] = useState<any[]>([]);

  // --- Add state for expense request notifications ---
  const [expenseRequestNotifications, setExpenseRequestNotifications] = useState(0);
  // --- ---

  const userId = profile?.id;

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  // --- Add useEffect to fetch expense request notifications ---
  useEffect(() => {
    const fetchExpenseRequestNotifications = async () => {
      if (!userId) return;

      try {
        // 1. Get worker IDs created by this admin
        const { data: workers, error: workersError } = await supabase
          .from('workers')
          .select('id')
          .eq('created_by', userId);

        if (workersError) {
          console.error('Error fetching workers for notifications:', workersError);
          setExpenseRequestNotifications(0);
          return;
        }

        const workerIds = workers?.map(w => w.id) || [];

        if (workerIds.length === 0) {
          setExpenseRequestNotifications(0);
          return;
        }

        // 2. Count pending expense requests for these workers
        const { count, error: countError } = await supabase
          .from('expense_requests')
          .select('*', { count: 'exact', head: true })
          .in('worker_id', workerIds)
          .eq('status', 'pending');

        if (countError) {
          console.error('Error counting expense requests:', countError);
          setExpenseRequestNotifications(0);
          return;
        }

        setExpenseRequestNotifications(count || 0);
      } catch (err) {
        console.error('Unexpected error fetching expense request notifications:', err);
        setExpenseRequestNotifications(0);
      }
    };

    fetchExpenseRequestNotifications();

    // Optional: Set up periodic polling (e.g., every 30 seconds)
    // const intervalId = setInterval(fetchExpenseRequestNotifications, 30000);
    // return () => clearInterval(intervalId);

  }, [userId]);
  // --- ---


  const fetchDashboardData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching dashboard data for admin ID:", userId);

      // --- 1. Fetch all workers created by this specific admin user ---
      const { data: workers, error: workersError } = await supabase
        .from("workers")
        .select("id") // We only need the IDs to fetch sales
        .eq("created_by", userId); // Filter by the admin's user ID

      if (workersError) {
        console.error("Error fetching workers:", workersError);
        toast.error("Failed to load worker data.");
        // Continue with empty worker list
      }

      const workerIds = workers?.map(worker => worker.id) || [];
      console.log("Worker IDs managed by this admin:", workerIds);

      // --- 2. Fetch sales data for these workers ---
      let salesDataResult: any[] = [];
      if (workerIds.length > 0) {
        const { data: sales, error: salesError } = await supabase
          .from("sales")
          .select(`
            id,
            total_amount,
            profit,
            product_id,
            created_at,
            products (name) // Join to get product name for recent activity
          `)
          .in("worker_id", workerIds) // Fetch sales where worker_id is one of the admin's workers
          .order("created_at", { ascending: false });

        if (salesError) {
          console.error("Error fetching sales ", salesError);
          toast.error("Failed to load sales data.");
        } else {
          salesDataResult = sales || [];
          console.log(`Fetched ${salesDataResult.length} sales for admin's workers.`);
        }
      } else {
        console.log("No workers found for this admin, hence no sales.");
        salesDataResult = [];
      }

      // --- 3. Fetch products created by this admin ---
      const { data: products, count: productCount, error: productsError } = await supabase
        .from("products")
        .select("id, name, stock, created_at", { count: "exact" })
        .eq("created_by", userId) // Filter products by the admin's user ID
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Error fetching products:", productsError);
        toast.error("Failed to load product data.");
      }

      // --- 4. Fetch shops created by this admin ---
      const { data: shops, count: shopCount, error: shopsError } = await supabase
        .from("shops")
        .select("*", { count: "exact" })
        .eq("created_by", userId) // Filter shops by the admin's user ID
        .order("created_at", { ascending: false });

      if (shopsError) {
        console.error("Error fetching shops:", shopsError);
        toast.error("Failed to load shop data.");
      }

      // --- 5. Calculate statistics based on fetched sales data ---
      const totalSales = salesDataResult.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
      const totalProfit = salesDataResult.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0);

      // Count low stock products
      const lowStock = products?.filter((p) => (p.stock || 0) < 10).length || 0;

      // Prepare data for the sales trend chart (last 7 unique days)
      const chartDataMap: Record<string, { date: string; sales: number; profit: number }> = {};
      salesDataResult.forEach(sale => {
        const dateKey = new Date(sale.created_at).toDateString(); // Use date string for grouping
        if (!chartDataMap[dateKey]) {
          chartDataMap[dateKey] = {
            date: new Date(sale.created_at).toLocaleDateString(),
            sales: 0,
            profit: 0,
          };
        }
        chartDataMap[dateKey].sales += Number(sale.total_amount) || 0;
        chartDataMap[dateKey].profit += Number(sale.profit) || 0;
      });

      const chartDataArray = Object.values(chartDataMap);
      // Sort by date and take last 7 days
      chartDataArray.sort((a, b) => new Date(Object.keys(chartDataMap).find(k => chartDataMap[k].date === a.date)!).getTime() - new Date(Object.keys(chartDataMap).find(k => chartDataMap[k].date === b.date)!).getTime());
      const chartData = chartDataArray.slice(-7);

      // Update state with fetched/calculated data
      setStats({
        totalSales,
        totalProfit,
        totalProducts: productCount || 0,
        lowStock,
        totalShops: shopCount || 0,
        totalWorkers: workerIds.length, // Count of workers managed by this admin
        monthlyGrowth: 12.5, // Placeholder
      });

      setSalesData(chartData);

      // Prepare data for the pie chart
      const pieChartData = [
        { name: "Products", value: productCount || 0, color: COLORS[0] },
        { name: "Shops", value: shopCount || 0, color: COLORS[1] },
        { name: "Workers", value: workerIds.length, color: COLORS[2] },
        { name: "Sales Records", value: salesDataResult.length, color: COLORS[3] },
      ].filter((item) => item.value > 0); // Only show non-zero values

      setPieData(pieChartData);

      // --- Best & Worst Selling Products Logic ---
      if (salesDataResult.length > 0 && products && products.length > 0) {
        // Aggregate sales by product_id
        const productSalesMap: Record<string, number> = {};
        salesDataResult.forEach((sale) => {
          if (sale.product_id) {
            productSalesMap[sale.product_id] = (productSalesMap[sale.product_id] || 0) + (Number(sale.total_amount) || 0);
          }
        });

        // Find best and worst selling product IDs
        let bestProductId: string | null = null;
        let worstProductId: string | null = null;
        let maxSales = -Infinity;
        let minSales = Infinity;

        for (const productId in productSalesMap) {
          const total = productSalesMap[productId];
          if (total > maxSales) {
            maxSales = total;
            bestProductId = productId;
          }
          // Ensure we don't pick a product with 0 sales as 'worst'
          if (total < minSales && total > 0) {
            minSales = total;
            worstProductId = productId;
          }
        }

        // Find the actual product objects
        const bestProductObj = bestProductId ? products.find(p => p.id === bestProductId) : null;
        const worstProductObj = worstProductId ? products.find(p => p.id === worstProductId) : null;

        setBestProduct(bestProductObj || null);
        setWorstProduct(worstProductObj || null);
      } else {
        // Reset if no data
        setBestProduct(null);
        setWorstProduct(null);
      }

      // --- Product Stock Data + Notifications ---
      if (products && products.length > 0) {
        // Get top 5 products by stock level for the bar chart
        const topProductsByStock = [...products]
          .sort((a, b) => (b.stock || 0) - (a.stock || 0)) // Sort descending by stock
          .slice(0, 5)
          .map((p, index) => ({
            name: p.name.length > 15 ? `${p.name.substring(0, 15)}...` : p.name,
            stock: Number(p.stock) || 0,
            color: COLORS[index % COLORS.length],
          }));

        setProductStockData(topProductsByStock);
        setProductNotifications(lowStock); // Number of low stock items
        setProductOverviewData(topProductsByStock); // For the notification card
      } else {
        // Reset if no products
        setProductStockData([]);
        setProductNotifications(0);
        setProductOverviewData([]);
      }

      // --- Worker Notifications + Overview ---
      const workerCount = workerIds.length;
      if (workerCount >= 0) {
        // Example notification logic
        setWorkerNotifications(workerCount < 5 ? workerCount : 0);
        setWorkerOverviewData([
          { name: "Workers", value: workerCount, color: COLORS[2] },
        ]);
      } else {
        setWorkerNotifications(0);
        setWorkerOverviewData([]);
      }

      // --- Latest Activity ---
      if (salesDataResult.length > 0) {
        // The sales data already includes the product name via the join
        const latest = salesDataResult.slice(0, 5).map((sale) => ({
          id: sale.id,
          productName: sale.products?.name || "Unknown Product",
          amount: sale.total_amount,
          date: new Date(sale.created_at).toLocaleString(),
        }));
        setRecentActivity(latest);
      } else {
        setRecentActivity([]);
      }

    } catch (error: any) {
      console.error("Unexpected error in fetchDashboardData:", error);
      toast.error(`An unexpected error occurred: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return <div className="p-6">Please log in to view dashboard</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* --- Add Notification Bell to the Header Area --- */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Business Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.name}!
          </p>
        </div>
        {/* --- Notification Bell Button --- */}
        <div className="flex items-center space-x-4">
          {/* --- New Expense Request Notification Bell --- */}
          <button
            onClick={() => navigate('/expenses')} // <-- Navigate to Expense Management using the correct path
            className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="View expense requests"
          >
            <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            {expenseRequestNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                {expenseRequestNotifications > 99 ? '99+' : expenseRequestNotifications}
              </span>
            )}
          </button>
          {/* --- --- */}
        </div>
      </div>
      {/* --- --- */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {[
          {
            title: "Total Sales",
            value: `KSh ${stats.totalSales.toLocaleString()}`,
            desc: "Total revenue",
            icon: DollarSign,
            gradient: "from-green-500 to-green-700",
          },
          {
            title: "Total Profit",
            value: `KSh ${stats.totalProfit.toLocaleString()}`,
            desc: "Net profit",
            icon: TrendingUp,
            gradient: "from-blue-500 to-blue-700",
          },
          {
            title: "Products",
            value: `${stats.totalProducts}`,
            desc: `${stats.lowStock} low stock`,
            icon: Package,
            gradient: "from-purple-500 to-purple-700",
          },
          {
            title: "Shops",
            value: `${stats.totalShops}`,
            desc: "Active shops",
            icon: Store,
            gradient: "from-orange-500 to-orange-700",
          },
          {
            title: "Workers",
            value: `${stats.totalWorkers}`,
            desc: "Total workers",
            icon: Users,
            gradient: "from-red-500 to-red-700",
          },
        ].map((card, i) => (
          <div key={i} className="relative rounded-xl group hover:scale-105 transform transition duration-500">
            <div className="absolute inset-0 rounded-xl p-[2px] bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-pink-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className={`relative z-10 bg-gradient-to-r ${card.gradient} text-white rounded-xl shadow-lg flex flex-col h-full`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(card.icon, { className: "h-5 w-5" })} {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm opacity-80">{card.desc}</p>
              </CardContent>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Product Notifications */}
        <div className="relative rounded-xl group hover:scale-105 transform transition duration-500">
          <div className="absolute inset-0 rounded-xl p-[2px] bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-pink-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative z-10 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl shadow-lg flex flex-col h-full">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Product Notifications
              </CardTitle>
              <span className="bg-red-600 rounded-full px-2 py-0.5 text-sm font-bold">{productNotifications}</span>
            </CardHeader>
            <CardContent>
              {productOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={productOverviewData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stock" name="Stock Level">
                      {productOverviewData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/80">
                  No product data available
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Worker Notifications */}
        <div className="relative rounded-xl group hover:scale-105 transform transition duration-500">
          <div className="absolute inset-0 rounded-xl p-[2px] bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-pink-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative z-10 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-xl shadow-lg flex flex-col h-full">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Worker Notifications
              </CardTitle>
              <span className="bg-red-600 rounded-full px-2 py-0.5 text-sm font-bold">{workerNotifications}</span>
            </CardHeader>
            <CardContent>
              {workerOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={workerOverviewData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {workerOverviewData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/80">
                  No worker data available
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </div>

      {/* Best / Worst Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {bestProduct && (
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Best Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{bestProduct.name}</p>
            </CardContent>
          </Card>
        )}
        {worstProduct && (
          <Card className="bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5" /> Least Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{worstProduct.name}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    name="Sales"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Profit"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                 <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                 <p>No sales data available for chart</p>
               </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-full flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <PieChart className="h-8 w-8 text-purple-500" />
                </div>
                <p>No business data available for chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Products in Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {productStockData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productStockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Stock: ${value}`, '']} />
                  <Bar dataKey="stock" name="Stock Level">
                    {productStockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p>No product stock data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" /> Latest Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((a) => (
                <li key={a.id} className="py-3 flex justify-between items-center">
                  <span className="font-medium">{a.productName}</span>
                  <div className="text-right">
                    <span className="block font-semibold text-green-600">KSh {Number(a.amount).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{a.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;