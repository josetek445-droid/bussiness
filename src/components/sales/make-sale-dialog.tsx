// @/components/sales/make-sale-dialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  buying_price: number; // must be loaded from DB
  minimum_selling_price: number;
  stock: number;
}

interface SaleItem {
  product: Product;
  quantity: number;
  selling_price: number;
}

interface MakeSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaleComplete: () => void;
  availableProducts: Product[];
  workerShopId: string | null;
  workerId: string;
}

export function MakeSaleDialog({
  open,
  onOpenChange,
  onSaleComplete,
  availableProducts = [],
  workerShopId,
  workerId
}: MakeSaleDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [isLoading, setIsLoading] = useState(false);

  // Update local products when availableProducts changes
  useEffect(() => {
    setProducts(availableProducts);
  }, [availableProducts]);

  const addToSale = () => {
    if (!selectedProduct) return;

    const existingItem = saleItems.find(item => item.product.id === selectedProduct.id);
    if (existingItem) {
      setSaleItems(items =>
        items.map(item =>
          item.product.id === selectedProduct.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSaleItems(items => [
        ...items,
        {
          product: selectedProduct,
          quantity: 1,
          selling_price: selectedProduct.minimum_selling_price
        }
      ]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSaleItems(items => items.filter(item => item.product.id !== productId));
    } else {
      setSaleItems(items =>
        items.map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(newQuantity, item.product.stock) }
            : item
        )
      );
    }
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setSaleItems(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, selling_price: Math.max(newPrice, item.product.minimum_selling_price) }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + item.quantity * item.selling_price, 0);
  };

  // Safe profit calculation
  const calculateItemProfit = (item: SaleItem) => {
    const buyingPrice =
      typeof item.product.buying_price === "number" ? item.product.buying_price : 0;

    if (buyingPrice === 0) {
      console.warn("⚠️ Missing buying_price for product:", item.product);
    }

    return (item.selling_price - buyingPrice) * item.quantity;
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      toast.error("Please add items to the sale");
      return;
    }

    if (!workerId || !workerShopId) {
      toast.error("Worker information missing");
      return;
    }

    setIsLoading(true);
    try {
      for (const item of saleItems) {
        const profitForItem = calculateItemProfit(item);

        const { error: saleError } = await supabase.from("sales").insert({
          product_id: item.product.id,
          worker_id: workerId,
          shop_id: workerShopId,
          quantity: item.quantity,
          selling_price: item.selling_price,
          total_amount: item.quantity * item.selling_price,
          payment_method: paymentMethod,
          profit: profitForItem // always numeric
        });

        if (saleError) throw saleError;

        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: item.product.stock - item.quantity })
          .eq("id", item.product.id);

        if (stockError) throw stockError;
      }

      toast.success("Sale completed successfully!");
      setSaleItems([]);
      setSelectedProduct(null);
      onSaleComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Error processing sale:", error);
      toast.error(`Error processing sale: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSaleItems([]);
      setSelectedProduct(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Make a Sale
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Select Products</h3>
            <div className="space-y-3">
              <div>
                <Label>Product</Label>
                <Select
                  value={selectedProduct?.id ?? undefined}
                  onValueChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    setSelectedProduct(product || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        No products available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Stock: {selectedProduct.stock}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Min Price: KSh {selectedProduct.minimum_selling_price}
                    </p>
                    <Button
                      onClick={addToSale}
                      className="mt-2 w-full"
                      size="sm"
                      disabled={
                        saleItems.some((item) => item.product.id === selectedProduct.id) &&
                        saleItems.find((item) => item.product.id === selectedProduct.id)?.quantity ===
                          selectedProduct.stock
                      }
                    >
                      Add to Sale
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sale Items */}
          <div className="space-y-4">
            <h3 className="font-semibold">Sale Items</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {saleItems.map((item) => (
                <Card key={item.product.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, 0)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Selling Price</Label>
                      <Input
                        type="number"
                        value={item.selling_price}
                        onChange={(e) =>
                          updatePrice(item.product.id, Number(e.target.value))
                        }
                        min={item.product.minimum_selling_price}
                        step="0.01"
                      />
                    </div>

                    <p className="text-sm font-medium mt-2">
                      Total: KSh {(item.quantity * item.selling_price).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {saleItems.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: "cash" | "mpesa") => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">
                      KSh {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={processSale}
                  className="w-full gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Complete Sale"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
