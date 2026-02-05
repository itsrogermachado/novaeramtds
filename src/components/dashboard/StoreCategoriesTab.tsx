 import { useState } from 'react';
 import { useStoreCategories, StoreCategory } from '@/hooks/useStoreCategories';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
 import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
 
 function slugify(text: string): string {
   return text
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/(^-|-$)/g, '');
 }
 
 interface CategoryFormData {
   name: string;
   slug: string;
   description: string;
   icon: string;
   status: 'active' | 'inactive';
   display_order: number;
 }
 
 const defaultFormData: CategoryFormData = {
   name: '',
   slug: '',
   description: '',
   icon: '📦',
   status: 'active',
   display_order: 0,
 };
 
 export function StoreCategoriesTab() {
   const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useStoreCategories();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
   const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
   const [deleteId, setDeleteId] = useState<string | null>(null);
 
   const handleOpenCreate = () => {
     setEditingCategory(null);
     setFormData({ ...defaultFormData, display_order: categories.length });
     setIsDialogOpen(true);
   };
 
   const handleOpenEdit = (category: StoreCategory) => {
     setEditingCategory(category);
     setFormData({
       name: category.name,
       slug: category.slug,
       description: category.description || '',
       icon: category.icon || '📦',
       status: category.status,
       display_order: category.display_order,
     });
     setIsDialogOpen(true);
   };
 
   const handleNameChange = (name: string) => {
     setFormData(prev => ({
       ...prev,
       name,
       slug: editingCategory ? prev.slug : slugify(name),
     }));
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (editingCategory) {
       await updateCategory(editingCategory.id, formData);
     } else {
       await createCategory(formData);
     }
     
     setIsDialogOpen(false);
     setFormData(defaultFormData);
     setEditingCategory(null);
   };
 
   const handleDelete = async () => {
     if (deleteId) {
       await deleteCategory(deleteId);
       setDeleteId(null);
     }
   };
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="flex items-center gap-2">
           <Package className="h-5 w-5" />
           Categorias da Loja
         </CardTitle>
         <Button onClick={handleOpenCreate} className="gap-2">
           <Plus className="h-4 w-4" />
           Criar categoria
         </Button>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex items-center justify-center py-8">
             <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
           </div>
         ) : categories.length === 0 ? (
           <div className="text-center py-12">
             <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
             <p className="text-muted-foreground">
               Nenhuma categoria cadastrada.
             </p>
             <p className="text-sm text-muted-foreground/70 mt-1">
               Use o botão "Criar categoria" para começar a montar sua loja.
             </p>
           </div>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead className="w-12"></TableHead>
                 <TableHead>Nome</TableHead>
                 <TableHead>Slug</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {categories.map((category) => (
                 <TableRow key={category.id}>
                   <TableCell>
                     <span className="text-xl">{category.icon || '📦'}</span>
                   </TableCell>
                   <TableCell className="font-medium">{category.name}</TableCell>
                   <TableCell className="text-muted-foreground text-sm">
                     /loja/{category.slug}
                   </TableCell>
                   <TableCell>
                     <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                       {category.status === 'active' ? 'Ativo' : 'Inativo'}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-2">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleOpenEdit(category)}
                       >
                         <Pencil className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => setDeleteId(category.id)}
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
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {editingCategory ? 'Editar Categoria' : 'Criar Categoria'}
             </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-[auto_1fr] gap-4">
               <div>
                 <Label>Ícone</Label>
                 <Input
                   value={formData.icon}
                   onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                   className="w-16 text-center text-xl"
                   maxLength={2}
                 />
               </div>
               <div>
                 <Label>Nome *</Label>
                 <Input
                   value={formData.name}
                   onChange={(e) => handleNameChange(e.target.value)}
                   placeholder="Ex: Ferramentas de Análise"
                   required
                 />
               </div>
             </div>
             
             <div>
               <Label>Slug (URL)</Label>
               <Input
                 value={formData.slug}
                 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                 placeholder="ex: ferramentas-de-analise"
               />
               <p className="text-xs text-muted-foreground mt-1">
                 URL: /loja/{formData.slug || 'slug'}
               </p>
             </div>
             
             <div>
               <Label>Descrição</Label>
               <Textarea
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 placeholder="Breve descrição da categoria..."
                 rows={3}
               />
             </div>
             
             <div className="flex items-center justify-between">
               <Label htmlFor="status">Ativo na loja</Label>
               <Switch
                 id="status"
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
               <Button type="submit" className="flex-1">
                 {editingCategory ? 'Salvar' : 'Criar'}
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
         title="Excluir categoria"
         description="Tem certeza que deseja excluir esta categoria? Todos os produtos associados também serão removidos."
       />
     </Card>
   );
 }