import { Shield, Users, TrendingUp, Package, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface LoginSelectionProps {
  onSelectRole: (role: "admin" | "worker") => void
}

export function LoginSelection({ onSelectRole }: LoginSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-10 w-60 h-60 bg-secondary/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-10 left-1/3 w-50 h-50 bg-accent/10 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>
      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            StockFlow Pro
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Advanced Sales & Stock Management System designed for modern
            businesses. Track inventory, manage sales, and analyze performance with
            powerful analytics.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
            <p className="text-gray-600">Track sales, profits, and performance with live dashboards</p>
          </div>
          
          <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Inventory</h3>
            <p className="text-gray-600">Automated stock tracking with low-stock alerts</p>
          </div>
          
          <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Reports</h3>
            <p className="text-gray-600">Comprehensive business insights and profit analysis</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Access Level</h2>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Business Admin */}
          <div className="bg-card/80 backdrop-blur rounded-3xl p-10 shadow-elegant border border-border/20 hover:shadow-glow hover:scale-[1.02] transition-all duration-500 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Business Admin</h3>
              <p className="text-gray-600 mb-8">Manage your business operations, track inventory, oversee workers, and analyze comprehensive sales reports.</p>
              
              <div className="space-y-3 text-left mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700">Complete inventory management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700">Worker performance tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700">Advanced analytics & reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700">Profit & loss monitoring</span>
                </div>
              </div>

              <Button 
                onClick={() => onSelectRole("admin")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl transition-colors"
                size="lg"
              >
                Access Admin Dashboard
              </Button>
            </div>
          </div>

          {/* Worker Access */}
          <div className="bg-card/80 backdrop-blur rounded-3xl p-10 shadow-elegant border border-border/20 hover:shadow-glow hover:scale-[1.02] transition-all duration-500 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Worker Access</h3>
              <p className="text-gray-600 mb-8">Process sales, track your performance, view earnings, and manage daily transactions.</p>
              
              <div className="space-y-3 text-left mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Quick sales processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Personal sales tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Earnings & payment history</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Performance insights</span>
                </div>
              </div>

              <Button 
                onClick={() => onSelectRole("worker")}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold rounded-xl transition-colors"
                size="lg"
              >
                Access Worker Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            Made in Bolt
          </p>
        </div>
      </div>
    </div>
  )
}