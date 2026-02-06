import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Sparkles, Image as ImageIcon, MessageCircle, Lock, EyeOff, Eye, Star } from 'lucide-react';
import { StoreProductWithCategory } from '@/hooks/useStoreProducts';

interface StoreCategory {
  id: string;
  name: string;
  icon: string | null;
  status: string;
}

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

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: StoreProductWithCategory | null;
  categories: StoreCategory[];
  onSubmit: (data: ProductFormData, isEditing: boolean) => Promise<void>;
  productsCount: number;
}

const defaultFormData: ProductFormData = {
  category_id: '',
  name: '',
  short_description: '',
  long_description: '',
  price: '1,00',
  comparison_price: '0,00',
  slug: '',
  video_url: '',
  delivery_type: 'manual',
  product_type: 'text',
  min_quantity: 1,
  max_quantity: 0,
  stock: '',
  post_sale_instructions: '',
  auto_open_chat: false,
  is_private: false,
  is_hidden: false,
  hide_sold_count: false,
  is_featured: false,
  status: 'active',
  cta_url: '',
  image_url: '',
  display_order: 0,
};

export function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  categories,
  onSubmit,
  productsCount,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        category_id: editingProduct.category_id,
        name: editingProduct.name,
        short_description: editingProduct.short_description || '',
        long_description: editingProduct.long_description || '',
        price: editingProduct.price,
        comparison_price: (editingProduct as any).comparison_price || '0,00',
        slug: (editingProduct as any).slug || '',
        video_url: (editingProduct as any).video_url || '',
        delivery_type: (editingProduct as any).delivery_type || 'manual',
        product_type: (editingProduct as any).product_type || 'text',
        min_quantity: (editingProduct as any).min_quantity ?? 1,
        max_quantity: (editingProduct as any).max_quantity ?? 0,
        stock: (editingProduct as any).stock || '',
        post_sale_instructions: (editingProduct as any).post_sale_instructions || '',
        auto_open_chat: (editingProduct as any).auto_open_chat ?? false,
        is_private: (editingProduct as any).is_private ?? false,
        is_hidden: (editingProduct as any).is_hidden ?? false,
        hide_sold_count: (editingProduct as any).hide_sold_count ?? false,
        is_featured: (editingProduct as any).is_featured ?? false,
        status: editingProduct.status,
        cta_url: editingProduct.cta_url || '',
        image_url: editingProduct.image_url || '',
        display_order: editingProduct.display_order,
      });
    } else {
      setFormData({ ...defaultFormData, display_order: productsCount });
    }
  }, [editingProduct, productsCount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData, !!editingProduct);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData({ ...formData, slug });
    }
  };

  const activeCategories = categories.filter(c => c.status === 'active');

  const ConfigToggle = ({ 
    icon: Icon, 
    label, 
    description, 
    checked, 
    onCheckedChange,
  }: { 
    icon: React.ElementType; 
    label: string; 
    description: string; 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-start gap-3 py-2">
      <div className={`p-1.5 rounded-full ${checked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${checked ? 'text-primary' : 'text-foreground'}`}>{label}</span>
          <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-lg">
                {editingProduct ? 'Editar Produto' : 'Criação Produto'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Por favor, preencha o formulário abaixo para {editingProduct ? 'editar' : 'iniciar o processo de criação do seu'} produto.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">Informações Básicas</h3>
                  
                  {/* Categoria */}
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className="bg-background">
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

                  {/* Título */}
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={generateSlug}
                      placeholder="Título do produto"
                      className="bg-background"
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.long_description}
                      onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                      placeholder="Descrição completa do produto..."
                      rows={6}
                      className="bg-background resize-none"
                    />
                  </div>

                  {/* Valor e Comparação */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor *</Label>
                      <Input
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="1,00"
                        className="bg-background"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Comparação <span className="text-muted-foreground text-xs">(opcional)</span>
                      </Label>
                      <Input
                        value={formData.comparison_price}
                        onChange={(e) => setFormData({ ...formData, comparison_price: e.target.value })}
                        placeholder="0,00"
                        className="bg-background"
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <Label>
                      Slug <span className="text-muted-foreground text-xs">(opcional)</span>
                    </Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="exemplo-produto"
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      O slug é o identificador único do produto. ex: /exemplo-produto
                    </p>
                  </div>

                  {/* YouTube/Streamable/Vimeo */}
                  <div className="space-y-2">
                    <Label>
                      YouTube/Streamable/Vimeo <span className="text-muted-foreground text-xs">(opcional)</span>
                    </Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      O link de um vídeo do YouTube/Streamable/Vimeo ou outra plataforma que será exibido na descrição do produto.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Tipos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">Tipos</h3>
                  
                  {/* Entrega */}
                  <div className="space-y-2">
                    <Label>Entrega</Label>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          formData.delivery_type === 'manual'
                            ? 'bg-muted text-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => setFormData({ ...formData, delivery_type: 'manual' })}
                      >
                        ✋ Manual
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          formData.delivery_type === 'automatic'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => setFormData({ ...formData, delivery_type: 'automatic' })}
                      >
                        <Sparkles className="h-4 w-4" /> Automática
                      </button>
                    </div>
                  </div>

                  {/* Produto (Texto/Linhas) */}
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors ${
                          formData.product_type === 'text'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => setFormData({ ...formData, product_type: 'text' })}
                      >
                        Texto
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors ${
                          formData.product_type === 'lines'
                            ? 'bg-muted text-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => setFormData({ ...formData, product_type: 'lines' })}
                      >
                        Linhas
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/50" />
                      No modo { formData.product_type === 'lines' ? 'LINHAS' : 'TEXTO' }, {formData.product_type === 'lines' ? 'efetua a retirada dos produtos do estoque, tratando cada linha como se fosse um produto diferente.' : 'o conteúdo é enviado como um texto único.'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Estoque */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">Estoque</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade Mínima</Label>
                      <Input
                        type="number"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Essa opção estabelece a quantidade mínima necessária para a compra do produto.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade Máxima</Label>
                      <Input
                        type="number"
                        value={formData.max_quantity}
                        onChange={(e) => setFormData({ ...formData, max_quantity: parseInt(e.target.value) || 0 })}
                        min={0}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Essa opção estabelece a quantidade máxima que pode ser comprada do produto.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estoque</Label>
                    <Textarea
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder={formData.product_type === 'lines' ? 'Cada linha será um produto...\nLinha 1\nLinha 2\nLinha 3' : 'Conteúdo do produto...'}
                      rows={4}
                      className="bg-background resize-none font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Link CTA */}
                <div className="space-y-2">
                  <Label>Link de compra (CTA URL)</Label>
                  <Input
                    value={formData.cta_url}
                    onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                    placeholder="https://..."
                    type="url"
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se preenchido, o botão "Comprar" abrirá este link.
                  </p>
                </div>
              </div>

              {/* Right Column - Image & Settings */}
              <div className="space-y-6">
                {/* Imagem do produto */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">Imagem do produto</h3>
                  
                  <div className="space-y-2">
                    <Label>
                      Imagens <span className="text-muted-foreground text-xs">(opcional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-background hover:bg-muted/30 transition-colors cursor-pointer">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Escolha uma imagem da Galeria
                      </p>
                      <p className="text-xs text-primary mt-1">1920 × 1080</p>
                    </div>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Ou cole uma URL de imagem..."
                      className="bg-background mt-2"
                    />
                  </div>
                </div>

                <Separator />

                {/* Pós-venda */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">Pós-venda</h3>
                  
                  <div className="space-y-2">
                    <Label>
                      Instruções <span className="text-muted-foreground text-xs">(opcional)</span>
                    </Label>
                    <Textarea
                      value={formData.post_sale_instructions}
                      onChange={(e) => setFormData({ ...formData, post_sale_instructions: e.target.value })}
                      placeholder="Instruções do produto"
                      rows={3}
                      className="bg-background resize-none"
                    />
                  </div>
                </div>

                <Separator />

                {/* Configurações */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-primary">Configurações</h3>
                  
                  <div className="space-y-1">
                    <ConfigToggle
                      icon={MessageCircle}
                      label="Abrir chat automaticamente"
                      description="Com essa opção ativa um chat será aberto para o cliente automaticamente."
                      checked={formData.auto_open_chat}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_open_chat: checked })}
                    />

                    <ConfigToggle
                      icon={Lock}
                      label="Privado"
                      description="Este produto será removido de sua loja e os clientes também não poderão usar o link direto."
                      checked={formData.is_private}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                    />

                    <ConfigToggle
                      icon={EyeOff}
                      label="Ocultar"
                      description="Essa opção oculta o produto após o estoque ser esgotado."
                      checked={formData.is_hidden}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_hidden: checked })}
                    />

                    <ConfigToggle
                      icon={Eye}
                      label="Ocultar Vendidos"
                      description="Essa opção oculta a quantidade de vendidos do produto."
                      checked={formData.hide_sold_count}
                      onCheckedChange={(checked) => setFormData({ ...formData, hide_sold_count: checked })}
                    />

                    <ConfigToggle
                      icon={Star}
                      label="Destaque"
                      description="Essa opção colocará o produto em destaque como o primeiro na exibição de categoria."
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                  </div>
                </div>

                {/* Status ativo */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <Label htmlFor="product-status" className="cursor-pointer">Ativo na loja</Label>
                  <Switch
                    id="product-status"
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!formData.category_id || !formData.name || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  editingProduct ? 'Salvar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
