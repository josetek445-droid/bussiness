import { useState } from "react"
import { ArrowLeft, Users, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface WorkerLoginProps {
  onBack: () => void
  onLogin: (workerData: any) => void
}

export function WorkerLogin({ onBack, onLogin }: WorkerLoginProps) {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!email || !phone) {
      toast.error("Please enter both email and password")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Verify credentials against workers table
      const { data: workers, error } = await supabase
        .from('workers')
        .select(`
          id,
          name,
          email,
          role,
          shop_id
        `)
        .eq('email', email)
        .eq('password', phone) // Using phone as password

      if (error) {
        console.error("Database error:", error)
        toast.error("Authentication service error")
        setIsLoading(false)
        return
      }

      if (!workers || workers.length === 0) {
        toast.error("Invalid credentials. Please check your email and password.")
        setIsLoading(false)
        return
      }

      const worker = workers[0]

      // Notify parent component of successful login with complete worker data
      onLogin(worker)
      toast.success(`Welcome back, ${worker.name}!`)
    } catch (error: any) {
      console.error("Login failed:", error)
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-accent/10 to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to selection
        </Button>

        <Card className="p-8 shadow-glow border border-border/20 bg-card/90 backdrop-blur">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Worker Access</h1>
            <p className="text-gray-600">Access your worker dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="worker@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Password)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="password"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Your phone number is used as your password
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Access Worker Dashboard"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need access? Contact your administrator
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}