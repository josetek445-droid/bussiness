import { useState } from "react"
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Banknote
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"

// Mock data for worker dashboard
const mockWorkerData = {
  workerName: "Mary Wanjiku",
  todaySales: "KSh 8,500",
  todayTarget: "KSh 10,000",
  weekSales: "KSh 52,300",
  monthSales: "KSh 187,400",
  commission: "KSh 18,740",
  pendingPayments: "KSh 12,500",
  overduePayments: "KSh 3,200",
  salesHistory: [
    { date: "2024-01-29", amount: "KSh 8,500", items: 15, status: "completed" },
    { date: "2024-01-28", amount: "KSh 12,300", items: 22, status: "completed" },
    { date: "2024-01-27", amount: "KSh 9,800", items: 18, status: "completed" },
    { date: "2024-01-26", amount: "KSh 11,100", items: 20, status: "completed" },
  ],
  recentSales: [
    { product: "Maize Flour 2kg", quantity: 5, unitPrice: "KSh 180", total: "KSh 900", time: "10:30 AM" },
    { product: "Cooking Oil 1L", quantity: 2, unitPrice: "KSh 320", total: "KSh 640", time: "11:15 AM" },
    { product: "Sugar 1kg", quantity: 3, unitPrice: "KSh 150", total: "KSh 450", time: "2:20 PM" },
  ]
}

export function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const targetProgress = (parseInt(mockWorkerData.todaySales.replace(/[^\d]/g, '')) / parseInt(mockWorkerData.todayTarget.replace(/[^\d]/g, ''))) * 100

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {mockWorkerData.workerName}!</h1>
          <p className="text-muted-foreground">
            Track your sales performance and manage your daily tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Today's Schedule
          </Button>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Sales"
          value={mockWorkerData.todaySales}
          description={`Target: ${mockWorkerData.todayTarget} (${targetProgress.toFixed(1)}%)`}
          icon={DollarSign}
          trend={{ value: targetProgress > 100 ? 5.2 : -2.1, label: "vs target" }}
        />
        <MetricCard
          title="This Week"
          value={mockWorkerData.weekSales}
          description="Weekly performance"
          icon={TrendingUp}
          trend={{ value: 15.3, label: "from last week" }}
        />
        <MetricCard
          title="Commission Earned"
          value={mockWorkerData.commission}
          description="10% commission rate"
          icon={Target}
          className="gradient-success text-success-foreground"
        />
        <MetricCard
          title="Pending Payments"
          value={mockWorkerData.pendingPayments}
          description="Customer payments due"
          icon={Clock}
          trend={{ value: -8.5, label: "from last week" }}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales History</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-dashboard">
              <CardHeader>
                <CardTitle>Today's Sales Breakdown</CardTitle>
                <CardDescription>Recent transactions and items sold</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockWorkerData.recentSales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{sale.product}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {sale.quantity} × {sale.unitPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-currency">{sale.total}</p>
                      <p className="text-xs text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-dashboard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Daily Target Progress
                </CardTitle>
                <CardDescription>Track your daily sales goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{targetProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(targetProgress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-currency">{mockWorkerData.todaySales}</p>
                    <p className="text-xs text-muted-foreground">Current Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{mockWorkerData.todayTarget}</p>
                    <p className="text-xs text-muted-foreground">Target</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card className="card-dashboard">
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>Your recent sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockWorkerData.salesHistory.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-success/10">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.date}</p>
                        <p className="text-sm text-muted-foreground">{sale.items} items sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-currency">{sale.amount}</p>
                      <Badge variant="secondary" className="text-xs">
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-dashboard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-success" />
                  Payment Summary
                </CardTitle>
                <CardDescription>Your earnings and commission details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month Sales</span>
                    <span className="font-bold text-currency">{mockWorkerData.monthSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission (10%)</span>
                    <span className="font-bold text-success">{mockWorkerData.commission}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total Earnings</span>
                    <span className="font-bold text-lg text-currency">{mockWorkerData.commission}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dashboard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Payment Tracking
                </CardTitle>
                <CardDescription>Customer payments and debts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Pending Payments</span>
                    <span className="font-bold text-currency">{mockWorkerData.pendingPayments}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">5 customers with pending payments</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overdue Payments</span>
                    <span className="font-bold text-currency text-destructive">{mockWorkerData.overduePayments}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">2 customers overdue (&gt;30 days)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}