import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Users, Plus, Edit, Trash2, Mail, Phone, Store, UserCheck, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeSwitcher } from "@/components/theme-switcher" // Adjust path if needed

interface Worker {
  id: string
  name: string
  email: string
  phone: string
  role: string
  shop_id: string | null
  created_by: string | null
  shops?: { name: string }
  created_at: string
}

interface Shop {
  id: string
  name: string
}

export function WorkerManagement() {
  const { profile, refreshProfile } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "worker" as "worker" | "admin",
    shop_id: ""
  })

  const userId = profile?.id
  const isAdmin = profile?.role === 'admin' || profile?.role === 'developer'

  useEffect(() => {
    if (userId) {
      fetchWorkers()
      if (isAdmin) {
        fetchShops()
      }
    }
  }, [userId, isAdmin])

  const fetchWorkers = async () => {
    if (!userId) return

    console.log('Fetching workers for admin:', userId, 'isAdmin:', isAdmin)

    let query = supabase
      .from('workers')
      .select(`
        *,
        shops (name)
      `)

    // Filter by created_by for admins
    if (isAdmin) {
      console.log("Filtering by created_by:", userId)
      query = query.eq("created_by", userId)
    } else {
      console.log("Filtering by id:", userId)
      query = query.eq("id", userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      toast.error("Error fetching workers")
      console.error('Fetch error:', error)
    } else {
      console.log('Fetched workers:', data)
      setWorkers(data || [])
    }
  }

  const fetchShops = async () => {
    if (!userId || !isAdmin) return
    
    // Only fetch shops created by current user
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('created_by', userId)
      .order('name')
      
    if (data) setShops(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    if (!userId || !isAdmin) {
      toast.error("Only admins can create workers")
      setIsLoading(false)
      return
    }
    
    if (editingWorker) {
      // Update existing worker (admins only)
      const shopIdValue = formData.shop_id === "none" || formData.shop_id === "" ? null : formData.shop_id;
      
      const { error } = await supabase
        .from('workers')
        .update({
          name: formData.name,
          phone: formData.phone,
          shop_id: shopIdValue
        })
        .eq('id', editingWorker.id)
        .eq('created_by', userId) // Security check using user ID
        
      if (error) {
        toast.error("Error updating worker")
        console.error('Update error:', error)
      } else {
        toast.success("Worker updated successfully")
        resetForm()
        fetchWorkers()
      }
    } else {
      // CREATE WORKER WITHOUT AUTO-LOGIN
      try {
        // Check if worker already exists
        const { data: existingWorker, error: fetchError } = await supabase
          .from('workers')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle()

        if (fetchError) {
          console.error("Error checking existing worker:", fetchError)
          toast.error("Database error while checking worker")
          setIsLoading(false)
          return
        }

        if (existingWorker) {
          toast.error("A worker with this email already exists.")
          setIsLoading(false)
          return
        }

        // Handle shop_id properly
        const shopIdValue = formData.shop_id === "none" || formData.shop_id === "" ? null : formData.shop_id;

        // Create auth user in workers table
        const { data: authData, error: authError } = await supabase
          .from('workers')
          .insert({
            name: formData.name,
            email: formData.email,
            password: formData.phone, // Using phone as initial password
            role: "worker",
            shop_id: shopIdValue,
            created_by: userId
          })
          .select()
          .single()

        if (authError) {
          console.error('Worker creation error:', authError)
          toast.error(`Error creating worker account: ${authError.message}`)
          setIsLoading(false)
          return
        }

        toast.success("Worker created successfully! They will receive an email to set up their account.")
        resetForm()
        fetchWorkers()
      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error("Failed to create worker account")
      }
    }
    setIsLoading(false)
  }

  const handleEdit = (worker: Worker) => {
    if (!isAdmin) {
      toast.error("Only admins can edit workers")
      return
    }
    
    setEditingWorker(worker)
    setFormData({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role as "worker" | "admin",
      shop_id: worker.shop_id || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!userId || !isAdmin) {
      toast.error("Only admins can delete workers")
      return
    }
    
    if (confirm("Are you sure you want to delete this worker? This will permanently remove their account and all associated data.")) {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', id)
        .eq('created_by', userId) // Security check using user ID
      
      if (error) {
        toast.error("Error deleting worker")
        console.error('Delete error:', error)
      } else {
        toast.success("Worker deleted successfully")
        fetchWorkers()
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "worker",
      shop_id: ""
    })
    setEditingWorker(null)
    setIsDialogOpen(false)
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to manage workers</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600
                         dark:from-purple-400 dark:to-pink-400">
            {profile?.role === 'worker' ? 'My Account' : 'Worker Management'}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-2
                       dark:text-gray-300">
            {profile?.role === 'worker' 
              ? 'View your account details'
              : 'Manage workers and their shop assignments'
            }
          </p>
        </div>
        {/* Theme Switcher */}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg gap-2 px-4 py-2 rounded-lg
                                 dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Worker</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-md bg-white rounded-xl shadow-2xl
                                     dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-2xl text-center text-gray-800
                                       dark:text-gray-100">
                  {editingWorker ? "Edit Worker" : "Add New Worker"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700
                                                   dark:text-gray-200">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                    className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                               dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-700
                                                     dark:text-gray-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                    disabled={!!editingWorker}
                    className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                               dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-gray-700
                                                     dark:text-gray-200">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                    className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                               dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {!editingWorker && (
                    <p className="text-xs text-muted-foreground mt-1
                                 dark:text-gray-400">
                      This will be used as their password
                    </p>
                  )}
                </div>
                
                {isAdmin && (
                  <div>
                    <Label className="text-gray-700
                                      dark:text-gray-200">Shop Assignment</Label>
                    <Select value={formData.shop_id} onValueChange={(value) => setFormData(prev => ({ ...prev, shop_id: value }))}>
                      <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                               dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <SelectValue placeholder="Select shop" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="none" className="dark:hover:bg-gray-700">No shop assigned</SelectItem>
                        {shops.map(shop => (
                          <SelectItem key={shop.id} value={shop.id} className="dark:hover:bg-gray-700">
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md
                               dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                  >
                    {isLoading ? "Processing..." : (editingWorker ? "Update" : "Create")} Worker
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={isLoading}
                    className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50
                               dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards - Only for admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg
                           dark:from-blue-600 dark:to-indigo-700">
            <CardContent className="p-4 flex items-center">
              <div className="rounded-full bg-white/20 p-3 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Total Workers</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg
                           dark:from-emerald-600 dark:to-teal-700">
            <CardContent className="p-4 flex items-center">
              <div className="rounded-full bg-white/20 p-3 mr-4">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Assigned Shops</p>
                <p className="text-2xl font-bold">{workers.filter(w => w.shop_id).length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg
                           dark:from-amber-600 dark:to-orange-700">
            <CardContent className="p-4 flex items-center">
              <div className="rounded-full bg-white/20 p-3 mr-4">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Recently Added</p>
                <p className="text-2xl font-bold">{workers.filter(w => {
                  const createdDate = new Date(w.created_at);
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return createdDate > sevenDaysAgo;
                }).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile-friendly worker cards for small screens */}
      <div className="block lg:hidden space-y-4">
        {workers.map((worker) => (
          <Card 
            key={worker.id} 
            className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-0 hover:shadow-2xl transition-all duration-300
                       dark:bg-gray-800/80 dark:border-gray-700"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4
                            dark:from-purple-600 dark:to-pink-600">
              <div className="flex justify-between items-start">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleEdit(worker)}
                      className="bg-white/20 hover:bg-white/30 text-white
                                 dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleDelete(worker.id)}
                      className="bg-white/20 hover:bg-white/30 text-white
                                 dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <h3 className="text-white text-xl font-bold mt-3">{worker.name}</h3>
              <Badge 
                variant={worker.role === 'admin' ? 'default' : 'secondary'} 
                className="bg-white/20 text-white border-0 mt-1
                           dark:bg-gray-700/50"
              >
                {worker.role}
              </Badge>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg
                                  dark:bg-purple-900/50">
                    <Mail className="h-4 w-4 text-purple-600
                                       dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground
                                 dark:text-gray-400">Email</p>
                    <p className="font-medium break-all
                                 dark:text-gray-200">{worker.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg
                                  dark:bg-purple-900/50">
                    <Phone className="h-4 w-4 text-purple-600
                                         dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground
                                 dark:text-gray-400">Phone</p>
                    <p className="font-medium
                                 dark:text-gray-200">{worker.phone}</p>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg
                                    dark:bg-purple-900/50">
                      <Store className="h-4 w-4 text-purple-600
                                           dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground
                                   dark:text-gray-400">Shop</p>
                      <p className="font-medium
                                   dark:text-gray-200">
                        {worker.shops?.name || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg
                                  dark:bg-purple-900/50">
                    <Calendar className="h-4 w-4 text-purple-600
                                           dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground
                                 dark:text-gray-400">Created</p>
                    <p className="font-medium
                                 dark:text-gray-200">{new Date(worker.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {workers.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0
                           dark:bg-gray-800/80 dark:border-gray-700">
            <CardContent className="text-center py-12">
              <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                              dark:bg-purple-900/50">
                <Users className="h-8 w-8 text-purple-600
                                 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2
                             dark:text-gray-100">
                {profile?.role === 'worker' ? 'Your Account' : 'No Workers Found'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto
                           dark:text-gray-400">
                {profile?.role === 'worker' 
                  ? 'Your account information will appear here.' 
                  : 'Start by adding your first worker.'}
              </p>
              {isAdmin && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg gap-2 px-6 py-3 rounded-lg
                             dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                >
                  <Plus className="h-5 w-5" />
                  Add Worker
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop table view */}
      <Card className="hidden lg:block bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0
                       dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl
                              dark:from-purple-600 dark:to-pink-600">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Users className="h-6 w-6" />
            {profile?.role === 'worker' ? 'My Account Details' : 'Workers Management'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50 hover:bg-purple-50
                                    dark:bg-gray-700 dark:hover:bg-gray-700">
                  <TableHead className="text-purple-700 font-semibold
                                       dark:text-purple-300">Name</TableHead>
                  <TableHead className="text-purple-700 font-semibold
                                       dark:text-purple-300">Email</TableHead>
                  <TableHead className="text-purple-700 font-semibold
                                       dark:text-purple-300">Phone</TableHead>
                  <TableHead className="text-purple-700 font-semibold
                                       dark:text-purple-300">Role</TableHead>
                  {isAdmin && <TableHead className="text-purple-700 font-semibold
                                                   dark:text-purple-300">Shop</TableHead>}
                  <TableHead className="text-purple-700 font-semibold
                                       dark:text-purple-300">Created</TableHead>
                  {isAdmin && (
                    <TableHead className="text-purple-700 font-semibold
                                         dark:text-purple-300">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow 
                    key={worker.id} 
                    className="hover:bg-purple-50 transition-colors border-b border-purple-100
                               dark:hover:bg-gray-700 dark:border-gray-700"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3
                                        dark:bg-purple-900/50">
                          <Users className="h-4 w-4 text-purple-600
                                             dark:text-purple-400" />
                        </div>
                        <span className="dark:text-gray-200">{worker.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground
                                        dark:text-gray-400" />
                        <span className="break-all dark:text-gray-200">{worker.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground
                                          dark:text-gray-400" />
                        <span className="dark:text-gray-200">{worker.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={worker.role === 'admin' ? 'default' : 'secondary'}
                        className={`${worker.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}
                      >
                        {worker.role}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {worker.shops?.name ? (
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground
                                              dark:text-gray-400" />
                            <span className="dark:text-gray-200">{worker.shops.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground
                                          dark:text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground
                                            dark:text-gray-400" />
                        <span className="dark:text-gray-200">{new Date(worker.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEdit(worker)}
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100
                                       dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(worker.id)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-100
                                       dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {workers.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                                dark:bg-purple-900/50">
                  <Users className="h-8 w-8 text-purple-600
                                   dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2
                               dark:text-gray-100">
                  {profile?.role === 'worker' ? 'Your Account' : 'No Workers Found'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto
                             dark:text-gray-400">
                  {profile?.role === 'worker' 
                    ? 'Your account information will appear here.' 
                    : 'Start by adding your first worker.'}
                </p>
                {isAdmin && (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg gap-2 px-6 py-3 rounded-lg
                               dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                  >
                    <Plus className="h-5 w-5" />
                    Add Worker
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}