"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  origin: string
  grade: string
  price_per_100: number
  bulk_price_per_1000: number
  bulk_min_qty: number
  unit: string
  available: boolean
  description: string
  tag?: string | null
}

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  origin: "",
  grade: "Grade A",
  price_per_100: 0,
  bulk_price_per_1000: 0,
  bulk_min_qty: 1000,
  unit: "leaves",
  available: true,
  description: "",
  tag: null,
}

const grades = ["Premium A+", "Premium A", "Grade A", "Grade B+", "Grade B"]
const tags = ["", "Best Seller", "Premium", "New Arrival"]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openCreate() {
    setEditingProduct(null)
    setForm(emptyProduct)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setForm({
      name: product.name,
      origin: product.origin,
      grade: product.grade,
      price_per_100: product.price_per_100,
      bulk_price_per_1000: product.bulk_price_per_1000,
      bulk_min_qty: product.bulk_min_qty,
      unit: product.unit,
      available: product.available,
      description: product.description,
      tag: product.tag ?? null,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const isEdit = !!editingProduct
      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingProduct.id, ...form } : form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save product")
      }

      toast.success(isEdit ? "Product updated" : "Product created")
      setDialogOpen(false)
      fetchProducts()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/products?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Product deleted")
      fetchProducts()
    } catch {
      toast.error("Failed to delete product")
    } finally {
      setDeleteId(null)
    }
  }

  async function toggleAvailability(product: Product) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, available: !product.available }),
      })
      if (!res.ok) throw new Error("Failed to update")
      fetchProducts()
    } catch {
      toast.error("Failed to toggle availability")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Origin</TableHead>
              <TableHead className="hidden md:table-cell">Grade</TableHead>
              <TableHead className="text-right">Price/100</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Bulk/1000</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="hidden md:table-cell">Tag</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No products found. Add your first product.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{product.origin}</TableCell>
                  <TableCell className="hidden md:table-cell">{product.grade}</TableCell>
                  <TableCell className="text-right">{"\u20B9"}{product.price_per_100}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right">{"\u20B9"}{product.bulk_price_per_1000}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => toggleAvailability(product)}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {product.tag ? <Badge variant="secondary">{product.tag}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="origin">Origin</Label>
                <Input id="origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger id="grade"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price per 100 leaves</Label>
                <Input id="price" type="number" value={form.price_per_100} onChange={(e) => setForm({ ...form, price_per_100: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk_price">Bulk Price per 1000 leaves</Label>
                <Input id="bulk_price" type="number" value={form.bulk_price_per_1000} onChange={(e) => setForm({ ...form, bulk_price_per_1000: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bulk_min">Bulk Min (leaves)</Label>
                <Input id="bulk_min" type="number" value={form.bulk_min_qty} onChange={(e) => setForm({ ...form, bulk_min_qty: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tag">Tag</Label>
                <Select value={form.tag ?? ""} onValueChange={(v) => setForm({ ...form, tag: v || null })}>
                  <SelectTrigger id="tag"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t} value={t || "none"}>{t || "None"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="available" checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
              <Label htmlFor="available">Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This will also remove it from mandi rates. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
