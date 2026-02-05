 import { useState } from 'react';
import { useStoreProducts, StoreProductWithCategory } from '@/hooks/useStoreProducts';
 import { useStoreCategories } from '@/hooks/useStoreCategories';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react';
 import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
 
 interface ProductFormData {
   category_id: string;
   name: string;
   short_description: string;
   long_description: string;
   price: string;
   status: 'active' | 'inactive';
   cta_url: string;
   image_url: string;
   display_order: number;
 }
 
 const defaultFormData: ProductFormData = {
   category_id: '',
   name: '',
   short_description: '',
   long_description: '',
   price: '',
   status: 'active',
   cta_url: '',
   image_url: '',
   display_order: 0,
 };
 
 export function StoreProductsTab() {
   const { products, isLoading, createProduct, updateProduct, deleteProduct } = useStoreProducts();
   const { categories } = useStoreCategories();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState<StoreProductWithCategory | null>(null);
   const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
   const [deleteId, setDeleteId] = useState<string | null>(null);
 
   const handleOpenCreate = () => {
     setEditingProduct(null);
     setFormData({ ...defaultFormData, display_order: products.length });
     setIsDialogOpen(true);
   };
 
   const handleOpenEdit = (product: StoreProductWithCategory) => {
     setEditingProduct(product);
     setFormData({
       category_id: product.category_id,
       name: product.name,
       short_description: product.short_description || '',
       long_description: product.long_description || '',
       price: product.price,
       status: product.status,
       cta_url: product.cta_url || '',
       image_url: product.image_url || '',
       display_order: product.display_order,
     });
     setIsDialogOpen(true);
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (editingProduct) {
       await updateProduct(editingProduct.id, formData);
     } else {
       await createProduct(formData);
     }
     
     setIsDialogOpen(false);
     setFormData(defaultFormData);
     setEditingProduct(null);
   };
 
   const handleDelete = async () => {
     if (deleteId) {
       await deleteProduct(deleteId);
       setDeleteId(null);
     }
   };
 
   const activeCategories = categories.filter(c => c.status === 'active');
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="flex items-center gap-2">
           <ShoppingBag className="h-5 w-5" />
           Produtos da Loja
         </CardTitle>
         <Button onClick={handleOpenCreate} className="gap-2" disabled={activeCategories.length === 0}>
           <Plus className="h-4 w-4" />
           Criar produto
         </Button>
       </CardHeader>
       <CardContent>
         {activeCategories.length === 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted border border-border text-muted-foreground text-sm">
             Crie pelo menos uma categoria ativa antes de adicionar produtos.
           </div>
         )}
         
         {isLoading ? (
           <div className="flex items-center justify-center py-8">
             <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
           </div>
         ) : products.length === 0 ? (
           <div className="text-center py-12">
             <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
             <p className="text-muted-foreground">
               Você ainda não cadastrou produtos.
             </p>
             <p className="text-sm text-muted-foreground/70 mt-1">
               Crie o primeiro produto para disponibilizá-lo na Loja Nova Era.
             </p>
           </div>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nome</TableHead>
                 <TableHead>Categoria</TableHead>
                 <TableHead>Preço</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {products.map((product) => (
                 <TableRow key={product.id}>
                   <TableCell className="font-medium">{product.name}</TableCell>
                   <TableCell className="text-muted-foreground">
                     {product.store_categories?.name || '—'}
                   </TableCell>
                   <TableCell>{product.price}</TableCell>
                   <TableCell>
                     <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                       {product.status === 'active' ? 'Ativo' : 'Inativo'}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-2">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleOpenEdit(product)}
                       >
                         <Pencil className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => setDeleteId(product.id)}
                         className="text-destructive hover:text-destructive"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         )}
       </CardContent>
 
       {/* Create/Edit Dialog */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               {editingProduct ? 'Editar Produto' : 'Criar Produto'}
             </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <Label>Categoria *</Label>
               <Select
                 value={formData.category_id}
                 onValueChange={(value) => setFormData({ ...formData, category_id: value })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione uma categoria" />
                 </SelectTrigger>
                 <SelectContent>
                   {activeCategories.map((cat) => (
                     <SelectItem key={cat.id} value={cat.id}>
                       {cat.icon} {cat.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             
             <div>
               <Label>Nome do Produto *</Label>
               <Input
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 placeholder="Ex: Pacote Básico"
                 required
               />
             </div>
             
             <div>
               <Label>Preço *</Label>
               <Input
                 value={formData.price}
                 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                 placeholder="Ex: R$ 99,90"
                 required
               />
             </div>
             
             <div>
               <Label>Descrição curta</Label>
               <Input
                 value={formData.short_description}
                 onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                 placeholder="Uma linha sobre o produto"
               />
             </div>
             
             <div>
               <Label>Descrição completa</Label>
               <Textarea
                 value={formData.long_description}
                 onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                 placeholder="Detalhes do produto..."
                 rows={4}
               />
             </div>
             
             <div>
               <Label>Link de compra (CTA URL)</Label>
               <Input
                 value={formData.cta_url}
                 onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                 placeholder="https://..."
                 type="url"
               />
               <p className="text-xs text-muted-foreground mt-1">
                 Se preenchido, o botão "Comprar" abrirá este link.
               </p>
             </div>
             
             <div className="flex items-center justify-between">
               <Label htmlFor="product-status">Ativo na loja</Label>
               <Switch
                 id="product-status"
                 checked={formData.status === 'active'}
                 onCheckedChange={(checked) => 
                   setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                 }
               />
             </div>
             
             <div className="flex gap-3 pt-4">
               <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                 Cancelar
               </Button>
               <Button type="submit" className="flex-1" disabled={!formData.category_id}>
                 {editingProduct ? 'Salvar' : 'Criar'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation */}
       <ConfirmDeleteDialog
         open={!!deleteId}
         onOpenChange={(open) => !open && setDeleteId(null)}
         onConfirm={handleDelete}
         title="Excluir produto"
         description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
       />
     </Card>
   );
 }