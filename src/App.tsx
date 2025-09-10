import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { AuthPage } from "@/components/auth/auth-page"
import { AppLayout } from "@/components/layout/app-layout"
import AdminDashboard from "@/components/pages/admin-dashboard"
import WorkerDashboard from "@/components/pages/worker-dashboard"
import { ProductManagement } from "@/components/pages/product-management"
import { ShopManagement } from "@/components/pages/shop-management"
import { WorkerManagement } from "@/components/pages/worker-management"
import { SalesManagement } from "@/components/pages/sales-management"
import { ExpenseManagement } from "@/components/pages/expense-management"
import { EarningsPage } from "@/components/pages/earnings-page"
import { ExpenseRequestsPage } from "@/components/pages/expense-requests-page"
import { ChangePassword as ChangePasswordPage } from "@/components/pages/change-password"
import { AdminManagement } from "@/components/pages/admin-management"
import MainAdminDashboard from "@/components/pages/main-admin-dashboard"
import NotFound from "@/pages/NotFound"

const queryClient = new QueryClient()

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, workerSession, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user || workerSession) {
    return <>{children}</>
  }

  return <Navigate to="/login" />
}

// Component to handle dashboard routing based on user type
const DashboardRouter = () => {
  const { user, workerSession, profile } = useAuth()

  if (workerSession) {
    return <WorkerDashboard />
  }

  if (user) {
    return <AdminDashboard />
  }

  return <Navigate to="/login" />
}

// Component to handle role-based route access
const RoleBasedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const { profile, workerSession } = useAuth()
  
  // For worker routes, check if there's a worker session
  if (allowedRoles.includes('worker') && workerSession) {
    return <>{children}</>
  }
  
  // For admin/developer routes, check profile role
  if (profile && allowedRoles.includes(profile.role)) {
    return <>{children}</>
  }
  
  return <NotFound />
}

function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* Dashboard routes */}
          <Route index element={<DashboardRouter />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          
          {/* Admin & Developer Routes */}
          <Route path="products" element={
            <RoleBasedRoute allowedRoles={['admin', 'developer']}>
              <ProductManagement />
            </RoleBasedRoute>
          } />
          <Route path="shops" element={
            <RoleBasedRoute allowedRoles={['admin', 'developer']}>
              <ShopManagement />
            </RoleBasedRoute>
          } />
          <Route path="workers" element={
            <RoleBasedRoute allowedRoles={['admin', 'developer']}>
              <WorkerManagement />
            </RoleBasedRoute>
          } />
          <Route path="sales" element={
            <RoleBasedRoute allowedRoles={['admin', 'developer']}>
              <SalesManagement />
            </RoleBasedRoute>
          } />
          <Route path="expenses" element={
            <RoleBasedRoute allowedRoles={['admin', 'developer']}>
              <ExpenseManagement />
            </RoleBasedRoute>
          } />
          
          {/* Developer Only Routes */}
          <Route path="admin-management" element={
            <RoleBasedRoute allowedRoles={['developer']}>
              <AdminManagement />
            </RoleBasedRoute>
          } />
          <Route path="main-admin" element={
            <RoleBasedRoute allowedRoles={['developer']}>
              <MainAdminDashboard />
            </RoleBasedRoute>
          } />
          
          {/* Worker Routes */}
          <Route path="earnings" element={
            <RoleBasedRoute allowedRoles={['worker']}>
              <EarningsPage />
            </RoleBasedRoute>
          } />
          <Route path="expense-requests" element={
            <RoleBasedRoute allowedRoles={['worker']}>
              <ExpenseRequestsPage />
            </RoleBasedRoute>
          } />
          <Route path="change-password" element={
            <RoleBasedRoute allowedRoles={['worker']}>
              <ChangePasswordPage />
            </RoleBasedRoute>
          } />
        </Route>
        
        {/* Worker Dashboard (separate route) */}
        <Route path="/worker-dashboard" element={
          <ProtectedRoute>
            <WorkerDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App