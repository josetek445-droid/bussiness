import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Store, Plus, Edit2, Trash2, MapPin, Phone, Building2, Calendar, Hash } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeSwitcher } from "@/components/theme-switcher" // Adjust path if needed

interface Shop {
  id: string
  name: string
  location: string
  phone: string
  created_at: string
  created_by: string
}

export function ShopManagement() {
  const { profile } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: ""
  })
  const [isLoading, setIsLoading] = useState(true)

  const userId = profile?.id

  useEffect(() => {
    if (userId) {
      fetchShops()
    }
  }, [userId])

  const fetchShops = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('created_by', userId) // Only fetch shops created by current user
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Error fetching shops")
    } else {
      setShops(data || [])
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const shopData = {
      name: formData.name,
      location: formData.location,
      phone: formData.phone,
      created_by: userId // Set creator ID
    }

    if (editingShop) {
      const { error } = await supabase
        .from('shops')
        .update(shopData)
        .eq('id', editingShop.id)
        .eq('created_by', userId) // Security check
        
      if (error) {
        toast.error("Error updating shop")
      } else {
        toast.success("Shop updated successfully")
        resetForm()
        fetchShops()
      }
    } else {
      const { error } = await supabase
        .from('shops')
        .insert(shopData)
        
      if (error) {
        toast.error("Error creating shop")
      } else {
        toast.success("Shop created successfully")
        resetForm()
        fetchShops()
      }
    }
  }

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop)
    setFormData({
      name: shop.name,
      location: shop.location,
      phone: shop.phone || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this shop? This will also delete all associated products and sales.")) {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id)
        .eq('created_by', userId) // Security check
      
      if (error) {
        toast.error("Error deleting shop")
      } else {
        toast.success("Shop deleted successfully")
        fetchShops()
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      phone: ""
    })
    setEditingShop(null)
    setIsDialogOpen(false)
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to manage shops</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600
                         dark:from-purple-400 dark:to-pink-400">
            Shop Management
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-2
                       dark:text-gray-300">
            Manage your business locations
          </p>
        </div>
        {/* Theme Switcher */}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg gap-2 px-4 py-2 rounded-lg
                               dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Shop</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-md bg-white rounded-xl shadow-2xl
                                   dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-gray-800
                                     dark:text-gray-100">
                {editingShop ? "Edit Shop" : "Add New Shop"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700
                                                 dark:text-gray-200">Shop Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter shop name"
                  required
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                             dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="location" className="text-gray-700
                                                     dark:text-gray-200">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter shop location"
                  required
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
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                             dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md
                             dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                >
                  {editingShop ? "Update" : "Create"} Shop
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50
                             dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg
                         dark:from-blue-600 dark:to-indigo-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Shops</p>
              <p className="text-2xl font-bold">{shops.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg
                         dark:from-emerald-600 dark:to-teal-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Locations</p>
              <p className="text-2xl font-bold">{[...new Set(shops.map(s => s.location))].length}</p>
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
              <p className="text-2xl font-bold">{shops.filter(s => {
                const createdDate = new Date(s.created_at);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return createdDate > sevenDaysAgo;
              }).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <Card 
            key={shop.id} 
            className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1
                       dark:bg-gray-800/80 dark:border-gray-700"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4
                            dark:from-purple-600 dark:to-pink-600">
              <div className="flex justify-between items-start">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(shop)}
                    className="bg-white/20 hover:bg-white/30 text-white
                               dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(shop.id)}
                    className="bg-white/20 hover:bg-white/30 text-white
                               dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-white text-xl mt-3">
                {shop.name}
              </CardTitle>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg
                                  dark:bg-purple-900/50">
                    <MapPin className="h-4 w-4 text-purple-600
                                       dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground
                                 dark:text-gray-400">Location</p>
                    <p className="font-medium
                                 dark:text-gray-200">{shop.location}</p>
                  </div>
                </div>
                
                {shop.phone && (
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
                                   dark:text-gray-200">{shop.phone}</p>
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
                                 dark:text-gray-200">{new Date(shop.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg
                                  dark:bg-purple-900/50">
                    <Hash className="h-4 w-4 text-purple-600
                                       dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground
                                 dark:text-gray-400">ID</p>
                    <p className="font-mono text-xs
                                 dark:text-gray-300">{shop.id.substring(0, 8)}...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shops.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-0
                         dark:bg-gray-800/80 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                            dark:bg-purple-900/50">
              <Store className="h-8 w-8 text-purple-600
                               dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2
                           dark:text-gray-100">No shops yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto
                         dark:text-gray-400">
              Create your first shop to start managing your business locations.
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg gap-2 px-6 py-3 rounded-lg
                         dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
            >
              <Plus className="h-5 w-5" />
              Add Your First Shop
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}