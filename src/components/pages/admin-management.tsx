import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCog, Plus, Edit, Trash2, Shield, Users, AlertTriangle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'developer' | 'worker'
  created_at: string
}

export function AdminManagement() {
  const { profile } = useAuth()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin' as 'admin' | 'developer'
  })
  const { toast } = useToast()

  // Only developers can access admin management
  if (profile?.role !== 'developer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Only main administrators (developers) can manage other administrators. 
          Contact your system administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'developer'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins((data || []).filter(admin => admin.role !== 'worker'))
    } catch (error) {
      console.error('Error fetching admins:', error)
      toast({
        title: "Error",
        description: "Failed to load administrators",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingAdmin) {
        // Update existing admin
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role
          })
          .eq('id', editingAdmin.id)

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Administrator updated successfully"
        })
      } else {
        // Create new admin account without email verification
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.phone, // Use phone as password
          options: {
            emailRedirectTo: undefined, // Disable email verification  
            data: {
              name: formData.name,
              phone: formData.phone,
              role: formData.role
            }
          }
        })

        if (authError) throw authError

        if (authData.user) {
          // Create profile with created_by field
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              created_by: profile?.id
            })

          if (profileError) throw profileError
        }

        toast({
          title: "Success",
          description: "Administrator added successfully"
        })
      }

      resetForm()
      fetchAdmins()
    } catch (error: any) {
      console.error('Auth error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save administrator",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role === 'worker' ? 'admin' : admin.role
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this administrator?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Administrator deleted successfully"
      })
      fetchAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast({
        title: "Error",
        description: "Failed to delete administrator",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', role: 'admin' })
    setEditingAdmin(null)
    setIsDialogOpen(false)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading administrators...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Management</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="hover:scale-105 transition-transform">
              <Plus className="mr-2 h-4 w-4" />
              Add Administrator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? 'Edit Administrator' : 'Add New Administrator'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'developer' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingAdmin ? 'Update' : 'Add'} Administrator
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {admins.map((admin) => (
          <Card key={admin.id} className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {admin.role === 'developer' ? (
                    <Shield className="h-5 w-5 text-purple-500" />
                  ) : (
                    <UserCog className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-lg">{admin.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(admin)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(admin.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {admin.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Phone:</strong> {admin.phone}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    admin.role === 'developer' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {admin.role === 'developer' ? 'Developer' : 'Administrator'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Added: {new Date(admin.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {admins.length === 0 && (
        <Card className="text-center p-8">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Administrators Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first administrator.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Administrator
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}