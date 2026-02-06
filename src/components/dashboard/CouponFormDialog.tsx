import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoreCoupon, CreateCouponInput } from '@/hooks/useStoreCoupons';
import { useStoreCategories } from '@/hooks/useStoreCategories';
import { useStoreProducts } from '@/hooks/useStoreProducts';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: StoreCoupon | null;
  onSubmit: (data: CreateCouponInput) => Promise<{ error: unknown }>;
}

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  onSubmit,
}: CouponFormDialogProps) {
  const { categories } = useStoreCategories();
  const { products } = useStoreProducts();
  
  const [isActive, setIsActive] = useState(true);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxOrderValue, setMaxOrderValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coupon) {
      setIsActive(coupon.is_active);
      setCode(coupon.code);
      setDiscountType(coupon.discount_type);
      setDiscountValue(String(coupon.discount_value));
      setMaxUses(coupon.max_uses > 0 ? String(coupon.max_uses) : '');
      setMinOrderValue(coupon.min_order_value > 0 ? String(coupon.min_order_value) : '');
      setMaxOrderValue(coupon.max_order_value > 0 ? String(coupon.max_order_value) : '');
      setMaxDiscountAmount(coupon.max_discount_amount > 0 ? String(coupon.max_discount_amount) : '');
      setSelectedCategories(coupon.category_ids || []);
      setSelectedProducts(coupon.product_ids || []);
    } else {
      resetForm();
    }
  }, [coupon, open]);

  const resetForm = () => {
    setIsActive(true);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMaxUses('');
    setMinOrderValue('');
    setMaxOrderValue('');
    setMaxDiscountAmount('');
    setSelectedCategories([]);
    setSelectedProducts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data: CreateCouponInput = {
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      max_uses: parseInt(maxUses) || 0,
      min_order_value: parseFloat(minOrderValue) || 0,
      max_order_value: parseFloat(maxOrderValue) || 0,
      max_discount_amount: parseFloat(maxDiscountAmount) || 0,
      is_active: isActive,
      valid_from: null,
      valid_until: null,
      category_ids: selectedCategories,
      product_ids: selectedProducts,
    };

    const { error } = await onSubmit(data);
    setIsSubmitting(false);

    if (!error) {
      onOpenChange(false);
      resetForm();
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleProduct = (prodId: string) => {
    setSelectedProducts(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {coupon ? 'Editar Cupom' : 'Criar Cupom'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
            <Button
              type="button"
              variant={isActive ? 'default' : 'ghost'}
              className={isActive ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setIsActive(true)}
            >
              Ativo
            </Button>
            <Button
              type="button"
              variant={!isActive ? 'default' : 'ghost'}
              className={!isActive ? 'bg-muted-foreground hover:bg-muted-foreground/80' : ''}
              onClick={() => setIsActive(false)}
            >
              Desativado
            </Button>
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Nome</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="NOME DO CUPOM"
              required
              className="uppercase"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <Label>Desconto</Label>
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">R$</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '5' : '10,00'}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Desconto em {discountType === 'percentage' ? 'porcentagem' : 'valor fixo'}
            </p>
          </div>

          {/* Max Uses */}
          <div className="space-y-2">
            <Label htmlFor="maxUses">Quantidade</Label>
            <Input
              id="maxUses"
              type="number"
              min="0"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="40"
            />
            <p className="text-xs text-muted-foreground">
              Quantidade de usos máximo que o cupom pode ter (0 = ilimitado)
            </p>
          </div>

          {/* Order Value Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mínimo</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Máximo</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxOrderValue}
                  onChange={(e) => setMaxOrderValue(e.target.value)}
                  placeholder="1.000,00"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-3">
            Valor Mínimo e Máximo do pedido que pode ser usado o cupom
          </p>

          {/* Max Discount */}
          <div className="space-y-2">
            <Label>Desconto Máximo</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valor máximo de desconto que pode ser aplicado (opcional)
            </p>
          </div>

          {/* References Section */}
          <div className="space-y-4">
            <Label>Referências</Label>
            <p className="text-xs text-muted-foreground">
              Selecione produtos ou categorias específicas para aplicar o cupom
            </p>

            {/* Categories */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Categorias ({selectedCategories.length})</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                    {selectedCategories.includes(cat.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Products */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Produtos ({selectedProducts.length})</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {products.map((prod) => (
                  <Badge
                    key={prod.id}
                    variant={selectedProducts.includes(prod.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleProduct(prod.id)}
                  >
                    {prod.name}
                    {selectedProducts.includes(prod.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {coupon ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
