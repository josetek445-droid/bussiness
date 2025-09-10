import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Calendar, Clock } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { MetricCard } from "@/components/metric-card"

interface EarningsData {
  totalEarnings: number
  monthlyEarnings: number
  pendingPayments: number
  lastPayment: number
  salesHistory: any[]
  paymentHistory: any[]
}

export function EarningsPage() {
  const { user } = useAuth()
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayments: 0,
    lastPayment: 0,
    salesHistory: [],
    paymentHistory: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEarningsData()
    }
  }, [user])

  const fetchEarningsData = async () => {
    try {
      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, products(name, buying_price)')
        .eq('worker_id', user?.id)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      // Fetch salary payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('worker_id', user?.id)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      // Calculate earnings
      const totalProfit = salesData?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0
      const totalPayments = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
      const pendingEarnings = totalProfit - totalPayments

      // Calculate this month's earnings
      const thisMonth = new Date().getMonth()
      const thisYear = new Date().getFullYear()
      const monthlyProfit = salesData?.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear
      }).reduce((sum, sale) => sum + Number(sale.profit), 0) || 0

      const lastPaymentAmount = paymentsData?.[0]?.amount || 0

      setEarningsData({
        totalEarnings: totalPayments,
        monthlyEarnings: monthlyProfit,
        pendingPayments: pendingEarnings,
        lastPayment: lastPaymentAmount,
        salesHistory: salesData || [],
        paymentHistory: paymentsData || []
      })
    } catch (error) {
      console.error('Error fetching earnings data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading earnings data...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Earnings</h1>
      
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Earnings"
          value={`$${earningsData.totalEarnings.toFixed(2)}`}
          description="Total amount earned"
          icon={DollarSign}
          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        />
        <MetricCard
          title="This Month"
          value={`$${earningsData.monthlyEarnings.toFixed(2)}`}
          description="Current month earnings"
          icon={Calendar}
          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        />
        <MetricCard
          title="Pending Payment"
          value={`$${earningsData.pendingPayments.toFixed(2)}`}
          description="Awaiting payment"
          icon={Clock}
          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        />
        <MetricCard
          title="Last Payment"
          value={`$${earningsData.lastPayment.toFixed(2)}`}
          description="Most recent payment"
          icon={TrendingUp}
          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        />
      </div>

      {/* Payment History */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earningsData.paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {earningsData.paymentHistory.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-medium">${Number(payment.amount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.month}/{payment.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No payment history available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales Activity */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Sales Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earningsData.salesHistory.length > 0 ? (
            <div className="space-y-4">
              {earningsData.salesHistory.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-medium">{sale.products?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {sale.quantity} × ${Number(sale.selling_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+${Number(sale.profit).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No sales activity found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}