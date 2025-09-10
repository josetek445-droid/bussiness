import { useState } from "react"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  BarChart3,
  Calendar,
  ShoppingCart,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"
import { Badge } from "@/components/ui/badge"

// Mock data for demonstration
const mockData = {
  totalSales: "KSh 2,847,500",
  profit: "KSh 934,200",
  workers: 12,
  products: 156,
  todaySales: "KSh 45,200",
  weekSales: "KSh 312,800",
  monthSales: "KSh 1,245,600",
  topWorkers: [
    { name: "Mary Wanjiku", sales: "KSh 124,500", profit: "KSh 42,300" },
    { name: "John Kiprotich", sales: "KSh 98,200", profit: "KSh 34,100" },
    { name: "Grace Akinyi", sales: "KSh 87,600", profit: "KSh 29,800" },
  ],
  lowStock: [
    { name: "Maize Flour 2kg", stock: 5, category: "Food" },
    { name: "Cooking Oil 1L", stock: 12, category: "Food" },
    { name: "Sugar 1kg", stock: 8, category: "Food" },
  ]
}

export function AdminDashboard() {
  const [timePeriod, setTimePeriod] = useState("week")

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your business performance and manage operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="rainbow" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button variant="rainbowBorder" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value={mockData.totalSales}
          description="Revenue this month"
          icon={DollarSign}
          trend={{ value: 12.5, label: "from last month" }}
          className="metric-purple"
        />
        <MetricCard
          title="Net Profit"
          value={mockData.profit}
          description="Profit margin 32.8%"
          icon={TrendingUp}
          trend={{ value: 8.2, label: "from last month" }}
          className="metric-green"
        />
        <MetricCard
          title="Active Workers"
          value={mockData.workers.toString()}
          description="Registered employees"
          icon={Users}
          trend={{ value: 2, label: "new this month" }}
          className="metric-blue"
        />
        <MetricCard
          title="Products"
          value={mockData.products.toString()}
          description="Items in inventory"
          icon={Package}
          trend={{ value: -3.1, label: "low stock alerts" }}
          className="metric-orange"
        />
      </div>

      {/* Sales Analytics */}
      <Tabs value={timePeriod} onValueChange={setTimePeriod} className="space-y-4">
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
        
        <TabsContent value="day" className="space-y-4">
          <Card className="card-dashboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Sales Overview
              </CardTitle>
              <CardDescription>
                Sales performance for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-currency">{mockData.todaySales}</div>
              <p className="text-sm text-muted-foreground">
                Target: KSh 50,000 (90.4% achieved)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card className="card-dashboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Sales Overview
              </CardTitle>
              <CardDescription>
                Sales performance for this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-currency">{mockData.weekSales}</div>
              <p className="text-sm text-muted-foreground">
                Target: KSh 350,000 (89.4% achieved)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card className="card-dashboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Sales Overview
              </CardTitle>
              <CardDescription>
                Sales performance for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-currency">{mockData.monthSales}</div>
              <p className="text-sm text-muted-foreground">
                Target: KSh 1,500,000 (83.0% achieved)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Worker Performance & Stock Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-dashboard">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Performing Workers
            </CardTitle>
            <CardDescription>
              Best sales performance this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.topWorkers.map((worker, index) => (
              <div key={worker.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Sales: {worker.sales}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-success">{worker.profit}</p>
                  <p className="text-xs text-muted-foreground">Profit</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-dashboard">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Items requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.lowStock.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="bg-warning text-warning-foreground">
                    {item.stock} left
                  </Badge>
                </div>
              </div>
            ))}
            <Button variant="rainbow" className="w-full">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Restock Items
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}