import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, DollarSign, Package, Search, Filter, Calendar, CreditCard, User } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface Sale {
  id: string
  created_at: string
  quantity: number
  selling_price: number
  total_amount: number
  profit: number
  payment_method: string
  product_id: string
  worker_id: string
  created_by: string // This is likely the worker's ID
  products?: {
    name: string
  }
  // Use the correct relationship for worker name
  workers?: { // Assuming the foreign key in 'sales' points to 'workers.id'
    name: string
  }
}

interface SalesStats {
  totalSales: number
  totalRevenue: number
  totalProfit: number
  totalProducts: number
}

export function SalesManagement() {
  const { toast } = useToast()
  const { profile } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all_methods')
  const [dateFilter, setDateFilter] = useState('all_time')

  const userId = profile?.id // This is the Admin's User ID

  useEffect(() => {
    if (userId) {
      fetchSalesData()
    }
  }, [userId])

  useEffect(() => {
    filterSales()
  }, [sales, searchTerm, paymentMethodFilter, dateFilter])

  const fetchSalesData = async () => {
    try {
      setLoading(true);

      // --- Step 1: Fetch workers managed by this admin ---
      // This replicates the logic from AdminDashboard
      console.log("Fetching workers for admin ID:", userId);
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('id') // Only need worker IDs
        .eq('created_by', userId); // Filter by the admin's user ID

      if (workersError) {
         console.error('Error fetching workers:', workersError)
         toast({
           title: "Error",
           description: "Failed to load worker data. Sales data might be incomplete.",
           variant: "destructive"
         })
         // Continue with an empty list, which will result in no sales being fetched
         // or handle it as appropriate for your app's UX
      }

      const workerIds = workers?.map(worker => worker.id) || [];
      console.log("Worker IDs managed by this admin:", workerIds);

      // --- Step 2: Fetch sales made by these workers ---
      let salesData: Sale[] = [];
      if (workerIds.length > 0) {
        console.log("Fetching sales for worker IDs:", workerIds);
        const { data, error } = await supabase
          .from('sales')
          .select(`
            *,
            products (name),
            workers (name) // Fetch worker name using the relationship
          `)
          .in('worker_id', workerIds) // Fetch sales where worker_id matches one of the admin's workers
          .order('created_at', { ascending: false })

        if (error) throw error
        salesData = data || [];
        console.log(`Fetched ${salesData.length} sales for admin's workers.`);
      } else {
        console.log("No workers found for this admin, hence no sales.");
        salesData = [];
      }

      setSales(salesData)
      
      // Calculate stats based on the fetched sales data
      const totalSales = salesData.length
      const totalRevenue = salesData.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0)
      const totalProfit = salesData.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0)
      const uniqueProducts = new Set(salesData.map(sale => sale.product_id)).size

      setStats({
        totalSales,
        totalRevenue,
        totalProfit,
        totalProducts: uniqueProducts
      })
    } catch (error) {
      console.error('Error fetching sales data:', error)
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterSales = () => {
    let filtered = [...sales] // Create a copy to avoid mutating state

    if (searchTerm) {
      filtered = filtered.filter(sale =>
        (sale.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Use the correct worker name field
        sale.workers?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (paymentMethodFilter && paymentMethodFilter !== 'all_methods') {
      filtered = filtered.filter(sale => sale.payment_method === paymentMethodFilter)
    }

    if (dateFilter && dateFilter !== 'all_time') {
      const today = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.created_at)
            return saleDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          filterDate.setDate(today.getDate() - 7)
          filtered = filtered.filter(sale => new Date(sale.created_at) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(today.getMonth() - 1)
          filtered = filtered.filter(sale => new Date(sale.created_at) >= filterDate)
          break
      }
    }

    setFilteredSales(filtered)
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view sales</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600
                       dark:from-purple-400 dark:to-pink-400">
          Sales Management
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mt-2
                     dark:text-gray-300">
          Track and analyze your sales performance
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                         dark:from-blue-600 dark:to-indigo-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Sales</p>
              <p className="text-2xl font-bold">{stats.totalSales}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                         dark:from-green-600 dark:to-emerald-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Revenue</p>
              <p className="text-2xl font-bold">KSh {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                         dark:from-teal-600 dark:to-cyan-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Profit</p>
              <p className="text-2xl font-bold">KSh {stats.totalProfit.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                         dark:from-purple-600 dark:to-pink-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Products Sold</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0
                       dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl
                              dark:from-purple-600 dark:to-pink-600">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Filter className="h-5 w-5" />
            Sales Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground
                                dark:text-gray-400" />
              <Input
                placeholder="Search by product or worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-purple-200 focus:border-purple-500 rounded-lg
                           dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                       dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all_methods" className="dark:hover:bg-gray-700">All methods</SelectItem>
                <SelectItem value="cash" className="dark:hover:bg-gray-700">Cash</SelectItem>
                <SelectItem value="card" className="dark:hover:bg-gray-700">Card</SelectItem>
                <SelectItem value="mobile" className="dark:hover:bg-gray-700">Mobile</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                       dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all_time" className="dark:hover:bg-gray-700">All time</SelectItem>
                <SelectItem value="today" className="dark:hover:bg-gray-700">Today</SelectItem>
                <SelectItem value="week" className="dark:hover:bg-gray-700">Last week</SelectItem>
                <SelectItem value="month" className="dark:hover:bg-gray-700">Last month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0
                       dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-t-2xl
                              dark:from-indigo-600 dark:to-blue-600">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5" />
            Sales Overview ({filteredSales.length} sales)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {filteredSales.length > 0 ? (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div 
                  key={sale.id} 
                  className="p-4 bg-white rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-all duration-300
                             dark:bg-gray-700 dark:border-gray-600"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-lg
                                        dark:bg-purple-900/50">
                          <Package className="h-6 w-6 text-purple-600
                                             dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg
                                        dark:text-gray-100">{sale.products?.name || 'Unknown Product'}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-muted-foreground
                                            dark:text-gray-400" />
                            <span className="text-sm text-muted-foreground
                                            dark:text-gray-300">
                              Sold by: {sale.workers?.name || 'Unknown Worker'} {/* Updated field */}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground
                                       dark:text-gray-400">Quantity</p>
                          <p className="font-bold text-lg
                                       dark:text-gray-200">{sale.quantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground
                                       dark:text-gray-400">Price</p>
                          <p className="font-bold text-lg
                                       dark:text-gray-200">KSh {Number(sale.selling_price).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600
                                     dark:text-green-400">KSh {Number(sale.total_amount).toLocaleString()}</p>
                        <p className="text-sm text-emerald-600 mt-1
                                     dark:text-emerald-400">
                          Profit: KSh {Number(sale.profit).toLocaleString()}
                        </p>
                        <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1
                                          dark:bg-blue-900/50 dark:text-blue-300">
                            <CreditCard className="h-3 w-3" />
                            {sale.payment_method}
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1
                                          dark:bg-purple-900/50 dark:text-purple-300">
                            <Calendar className="h-3 w-3" />
                            {new Date(sale.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                              dark:bg-purple-900/50">
                <BarChart3 className="h-8 w-8 text-purple-600
                                     dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2
                             dark:text-gray-100">
                {sales.length === 0 ? 'No sales recorded yet' : 'No matching sales found'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto
                           dark:text-gray-400">
                {sales.length === 0 
                  ? 'Start recording sales to see them appear here.' 
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}