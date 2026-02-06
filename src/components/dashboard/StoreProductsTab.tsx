import { useState } from 'react';
import { useStoreProducts, StoreProductWithCategory } from '@/hooks/useStoreProducts';
import { useStoreCategories } from '@/hooks/useStoreCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, ShoppingBag, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { ProductFormDialog } from './ProductFormDialog';
interface ProductFormData {
  category_id: string;
  name: string;
  short_description: string;
  long_description: string;
  price: string;
  comparison_price: string;
  slug: string;
  video_url: string;
  delivery_type: 'manual' | 'automatic';
  product_type: 'text' | 'lines';
  min_quantity: number;
  max_quantity: number;
  stock: string;
  post_sale_instructions: string;
  auto_open_chat: boolean;
  is_private: boolean;
  is_hidden: boolean;
  hide_sold_count: boolean;
  is_featured: boolean;
  status: 'active' | 'inactive';
  cta_url: string;
  image_url: string;
  display_order: number;
}

export function StoreProductsTab() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct, reorderProduct } = useStoreProducts();
  const { categories } = useStoreCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProductWithCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: StoreProductWithCategory) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (formData: ProductFormData, isEditing: boolean) => {
    if (isEditing && editingProduct) {
      await updateProduct(editingProduct.id, formData);
    } else {
      await createProduct(formData);
    }
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
                <TableHead className="w-20">Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => {
                const stockLines = product.stock?.split('\n').filter(line => line.trim()) || [];
                const availableStock = product.product_type === 'lines' ? stockLines.length : (product.stock ? 1 : 0);
                const isOutOfStock = availableStock === 0;
                
                return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => reorderProduct(product.id, 'up')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === products.length - 1}
                        onClick={() => reorderProduct(product.id, 'down')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      {(product as any).is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.store_categories?.name || '—'}
                  </TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${isOutOfStock ? 'text-destructive' : 'text-primary'}`}>
                      {availableStock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {(product as any).delivery_type === 'automatic' ? 'Automático' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.status === 'active'}
                      onCheckedChange={(checked) => 
                        updateProduct(product.id, { status: checked ? 'active' : 'inactive' })
                      }
                    />
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
              );})}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingProduct={editingProduct}
        categories={activeCategories}
        onSubmit={handleSubmit}
        productsCount={products.length}
      />

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
