import { Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Role = "admin" | "worker"

interface RoleSwitcherProps {
  currentRole: Role
  onRoleChange: (role: Role) => void
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <Card className="p-4 mb-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-muted-foreground">
          Demo Mode - Switch Role:
        </div>
        <div className="flex gap-2">
          <Button
            variant={currentRole === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => onRoleChange("admin")}
            className={currentRole === "admin" ? "gradient-primary" : ""}
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </Button>
          <Button
            variant={currentRole === "worker" ? "default" : "outline"}
            size="sm"
            onClick={() => onRoleChange("worker")}
            className={currentRole === "worker" ? "gradient-primary" : ""}
          >
            <Users className="h-4 w-4 mr-2" />
            Worker
          </Button>
        </div>
      </div>
    </Card>
  )
}