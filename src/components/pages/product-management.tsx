import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Package, Plus, Edit2, Trash2, ShoppingCart, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeSwitcher } from "@/components/theme-switcher" // Adjust path if needed

// Simplified Product interface
interface Product {
  id: string
  name: string
  buying_price: number
  minimum_selling_price: number
  stock: number
  shops: { name: string }
  created_by: string
  shop_id: string
}

interface Shop {
  id: string
  name: string
}

export function ProductManagement() {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])

  // Product dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form data - Simplified
  const [formData, setFormData] = useState({
    name: "",
    buying_price: "",
    minimum_selling_price: "",
    stock: "",
    shop_id: ""
  })

  // Access control
  const userId = profile?.id

  useEffect(() => {
    if (userId) {
      fetchProducts()
      fetchShops() // This will now fetch only shops owned by the user
    }
  }, [userId])

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        shops (name)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Error fetching products")
      console.error("Fetch products error:", error)
    } else {
      setProducts(data || [])
    }
  }

  // FIXED fetchShops function to filter by created_by
  const fetchShops = async () => {
    // Only fetch shops created by the current user (admin)
    // Ensure userId is available before fetching
    if (!userId) {
      console.error("User ID not available for fetching shops");
      setShops([]);
      return;
    }

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('created_by', userId) // Filter shops by the creator's ID
      .order('name');

    if (error) {
      console.error("Error fetching shops:", error);
      toast.error("Error loading shops.");
      // Optionally set shops to empty array on error
      // setShops([]);
    } else {
      setShops(data || []);
    }
  }
  // END OF FIX

  // Product management functions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return;

    const productData = {
      name: formData.name,
      buying_price: parseFloat(formData.buying_price),
      minimum_selling_price: parseFloat(formData.minimum_selling_price),
      stock: parseInt(formData.stock),
      shop_id: formData.shop_id,
      created_by: userId
    }

    let error;
    if (editingProduct) {
      ({ error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .eq('created_by', userId)
      )
      if (!error) toast.success("Product updated successfully")
    } else {
      ({ error } = await supabase
        .from('products')
        .insert(productData)
      )
      if (!error) toast.success("Product created successfully")
    }

    if (error) {
      toast.error(`Error ${editingProduct ? 'updating' : 'creating'} product`);
      console.error("Product save error:", error);
    } else {
      resetForm()
      fetchProducts()
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      buying_price: product.buying_price.toString(),
      minimum_selling_price: product.minimum_selling_price.toString(),
      stock: product.stock.toString(),
      shop_id: product.shop_id
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('created_by', userId)

    if (error) {
      toast.error("Error deleting product")
      console.error("Delete product error:", error)
    } else {
      toast.success("Product deleted successfully")
      fetchProducts()
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      buying_price: "",
      minimum_selling_price: "",
      stock: "",
      shop_id: ""
    })
    setEditingProduct(null)
    setIsDialogOpen(false)
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading your data...</p>
      </div>
    )
  }

  // Stats for dashboard
  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock < 10).length
  const totalValue = products.reduce((sum, product) =>
    sum + (product.buying_price * product.stock), 0
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600
                         dark:from-purple-400 dark:to-pink-400">
            Product Management
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-2
                       dark:text-gray-300">
            Manage your products
          </p>
        </div>
        {/* Theme Switcher */}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg
                         dark:from-blue-600 dark:to-indigo-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg
                         dark:from-amber-600 dark:to-orange-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Low Stock Items</p>
              <p className="text-2xl font-bold">{lowStockProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg
                         dark:from-emerald-600 dark:to-teal-700">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Inventory Value</p>
              <p className="text-2xl font-bold">KSh {totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="products" className="w-full">
        <div className="overflow-x-auto">
          {/* Simplified Tabs List - Only Products */}
          <TabsList className="grid w-full grid-cols-1 min-w-fit bg-white/80 backdrop-blur-sm shadow-md rounded-lg p-1
                              dark:bg-gray-800/80">
            <TabsTrigger
              value="products"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md transition-all
                         dark:data-[state=active]:from-purple-600 dark:data-[state=active]:to-pink-600"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
              <span className="sm:hidden">Products</span>
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6 mt-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg gap-2
                                   dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl
                                       dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-gray-800
                                         dark:text-gray-100">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <form onSubmit={handleSubmit} className="space-y-4 pr-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-700
                                                       dark:text-gray-200">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                   dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="buying_price" className="text-gray-700
                                                               dark:text-gray-200">Buying Price (KSh)</Label>
                      <Input
                        id="buying_price"
                        type="number"
                        step="0.01"
                        value={formData.buying_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, buying_price: e.target.value }))}
                        required
                        className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                   dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimum_selling_price" className="text-gray-700
                                                                       dark:text-gray-200">Minimum Selling Price (KSh)</Label>
                      <Input
                        id="minimum_selling_price"
                        type="number"
                        step="0.01"
                        value={formData.minimum_selling_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, minimum_selling_price: e.target.value }))}
                        required
                        className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                   dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock" className="text-gray-700
                                                        dark:text-gray-200">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                        required
                        className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                   dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shop" className="text-gray-700
                                                       dark:text-gray-200">Shop</Label>
                      <Select
                        value={formData.shop_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, shop_id: value }))}
                      >
                        <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg
                                                 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                          <SelectValue placeholder="Select shop" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {shops.map(shop => (
                            <SelectItem key={shop.id} value={shop.id} className="dark:hover:bg-gray-700">
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md
                                   dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                      >
                        {editingProduct ? "Update" : "Create"} Product
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
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-0
                           dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl
                                  dark:from-purple-600 dark:to-pink-600">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Package className="h-6 w-6" />
                Your Products
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
                      <TableHead className="text-purple-700 font-semibold hidden lg:table-cell
                                           dark:text-purple-300">Shop</TableHead>
                      <TableHead className="text-purple-700 font-semibold
                                           dark:text-purple-300">Buy Price</TableHead>
                      <TableHead className="text-purple-700 font-semibold hidden sm:table-cell
                                           dark:text-purple-300">Min Price</TableHead>
                      <TableHead className="text-purple-700 font-semibold
                                           dark:text-purple-300">Stock</TableHead>
                      <TableHead className="text-purple-700 font-semibold
                                           dark:text-purple-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-purple-50 transition-colors border-b border-purple-100
                                   dark:hover:bg-gray-700 dark:border-gray-700"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="bg-purple-100 p-2 rounded-lg mr-3
                                            dark:bg-purple-900/50">
                              <Package className="h-4 w-4 text-purple-600
                                                 dark:text-purple-400" />
                            </div>
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground
                                             dark:text-gray-400">
                          {product.shops?.name}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            KSh {product.buying_price.toLocaleString()}
                            <div className="sm:hidden text-xs text-muted-foreground
                                            dark:text-gray-400">
                              Min: KSh {product.minimum_selling_price.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-medium
                                             dark:text-gray-200">
                          KSh {product.minimum_selling_price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                            className={`${
                              product.stock > 10
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                : product.stock > 0
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                              }`}
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100
                                         dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-100
                                         dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {products.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4
                                    dark:bg-purple-900/50">
                      <Package className="h-8 w-8 text-purple-600
                                         dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1
                                   dark:text-gray-100">No products yet</h3>
                    <p className="text-gray-500 mb-4
                                 dark:text-gray-400">Get started by adding your first product</p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white
                                 dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}