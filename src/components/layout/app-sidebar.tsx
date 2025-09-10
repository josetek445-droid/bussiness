import { NavLink, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Users, 
  BarChart3, 
  Wallet, 
  DollarSign,
  Settings,
  FileText,
  UserCog,
  Home,
  ChevronRight
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

// Color definitions for each menu item
const menuItemColors = [
  { bg: "from-blue-500/10 to-blue-600/10", icon: "bg-blue-500/20 text-blue-600", active: "bg-blue-500/20 text-blue-600 border-blue-300" },
  { bg: "from-emerald-500/10 to-emerald-600/10", icon: "bg-emerald-500/20 text-emerald-600", active: "bg-emerald-500/20 text-emerald-600 border-emerald-300" },
  { bg: "from-amber-500/10 to-amber-600/10", icon: "bg-amber-500/20 text-amber-600", active: "bg-amber-500/20 text-amber-600 border-amber-300" },
  { bg: "from-rose-500/10 to-rose-600/10", icon: "bg-rose-500/20 text-rose-600", active: "bg-rose-500/20 text-rose-600 border-rose-300" },
  { bg: "from-violet-500/10 to-violet-600/10", icon: "bg-violet-500/20 text-violet-600", active: "bg-violet-500/20 text-violet-600 border-violet-300" },
  { bg: "from-cyan-500/10 to-cyan-600/10", icon: "bg-cyan-500/20 text-cyan-600", active: "bg-cyan-500/20 text-cyan-600 border-cyan-300" },
  { bg: "from-indigo-500/10 to-indigo-600/10", icon: "bg-indigo-500/20 text-indigo-600", active: "bg-indigo-500/20 text-indigo-600 border-indigo-300" },
]

const adminMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Shops", url: "/shops", icon: Store },
  { title: "Workers", url: "/workers", icon: Users },
  { title: "Sales", url: "/sales", icon: BarChart3 },
  { title: "Expenses", url: "/expenses", icon: Wallet },
]

const workerMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Earnings", url: "/earnings", icon: DollarSign },
  { title: "Requests", url: "/expense-requests", icon: FileText },
  { title: "Settings", url: "/change-password", icon: Settings },
]

const developerMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Shops", url: "/shops", icon: Store },
  { title: "Workers", url: "/workers", icon: Users },
  { title: "Sales", url: "/sales", icon: BarChart3 },
  { title: "Expenses", url: "/expenses", icon: Wallet },
  { title: "Admins", url: "/admin-management", icon: UserCog },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { profile } = useAuth()
  
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const getMenuItems = () => {
    if (profile?.role === 'developer') return developerMenuItems
    if (profile?.role === 'admin') return adminMenuItems
    return workerMenuItems
  }
  
  const menuItems = getMenuItems()
  
  return (
    <Sidebar 
      className={cn(
        "border-r bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Logo/Header Section */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
              <Store className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  BusinessPro
                </h2>
                <p className="text-xs text-muted-foreground">Management Suite</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Menu */}
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className={cn(
            "px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            collapsed && "sr-only"
          )}>
            Main Menu
          </SidebarGroupLabel>
          
          <SidebarGroupContent className="mt-3">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item, index) => {
                const colors = menuItemColors[index % menuItemColors.length]
                const isActive = currentPath === item.url
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                          "hover:bg-primary/10 hover:text-primary",
                          isActive 
                            ? `${colors.active} border shadow-sm` 
                            : "text-muted-foreground",
                          collapsed ? "justify-center" : "justify-between"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isActive 
                              ? colors.active 
                              : `${colors.icon} group-hover:bg-primary/10 group-hover:text-primary`
                          )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          {!collapsed && (
                            <span>{item.title}</span>
                          )}
                        </div>
                        
                        {!collapsed && isActive && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Role Indicator */}
        {!collapsed && profile && (
          <div className="mt-auto p-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {profile.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate">{profile.name || 'User'}</span>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full w-fit capitalize">
                  {profile.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}