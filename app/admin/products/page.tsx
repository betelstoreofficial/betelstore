"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
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
import { createClient } from "@/lib/supabase/client"

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
  image_url?: string | null
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
  image_url: null,
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
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setImagePreview(null)
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
      image_url: product.image_url ?? null,
    })
    setImagePreview(product.image_url ?? null)
    setDialogOpen(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName)

      setForm({ ...form, image_url: urlData.publicUrl })
      setImagePreview(urlData.publicUrl)
      toast.success("Image uploaded")
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    setForm({ ...form, image_url: null })
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
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
              <TableHead className="w-12">Image</TableHead>
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
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No products found. Add your first product.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/40">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
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
            {/* Image Upload */}
            <div className="grid gap-2">
              <Label>Product Image</Label>
              {imagePreview ? (
                <div className="relative w-full">
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    width={400}
                    height={200}
                    className="h-48 w-full rounded-lg border border-border object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white shadow-md hover:bg-black/90"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-primary/50 hover:bg-secondary/50"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">Click to upload image</span>
                      <span className="text-[10px] text-muted-foreground/70">JPG, PNG, WebP — max 5MB</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

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
            <Button onClick={handleSave} disabled={saving || uploading || !form.name}>
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
