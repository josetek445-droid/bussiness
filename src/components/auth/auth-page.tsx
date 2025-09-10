import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { LoginSelection } from "./login-selection"
import { AdminLogin } from "./admin-login"
import { WorkerLogin } from "./worker-login"

export function AuthPage() {
  const [currentView, setCurrentView] = useState<"selection" | "admin" | "worker">("selection")
  const { setWorkerSession, workerSession, user } = useAuth()
  const navigate = useNavigate()

  // Redirect when authenticated
  useEffect(() => {
    if (user) {
      // Admin is authenticated, redirect to dashboard
      navigate('/dashboard')
    } else if (workerSession) {
      // Worker is authenticated, redirect to worker dashboard
      navigate('/worker-dashboard')
    }
  }, [user, workerSession, navigate])

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Signed in successfully!")
        // Navigation will happen in the useEffect above
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const handleWorkerLogin = (workerData: any) => {
    try {
      // Store worker session in context and localStorage
      const workerSession = {
        id: workerData.id,
        name: workerData.name,
        email: workerData.email,
        role: workerData.role,
        shop_id: workerData.shop_id
      }
      
      setWorkerSession(workerSession)
      localStorage.setItem('workerSession', JSON.stringify(workerSession))
      
      toast.success(`Welcome back, ${workerData.name}!`)
      // Navigation will happen in the useEffect above
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const handleRoleSelect = (role: "admin" | "worker") => {
    setCurrentView(role)
  }

  const handleBack = () => {
    setCurrentView("selection")
  }

  // If already authenticated, don't show login forms
  if (user || workerSession) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (currentView === "admin") {
    return <AdminLogin onBack={handleBack} onLogin={handleAdminLogin} />
  }

  if (currentView === "worker") {
    return <WorkerLogin onBack={handleBack} onLogin={handleWorkerLogin} />
  }

  return <LoginSelection onSelectRole={handleRoleSelect} />
}