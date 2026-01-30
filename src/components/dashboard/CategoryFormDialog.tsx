import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ProductCategory } from '@/hooks/useProducts';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProductCategory | null;
  onClose: () => void;
}

const ICONS = [
  { value: 'book', label: '📚 Cursos' },
  { value: 'file-text', label: '📖 E-books' },
  { value: 'users', label: '👥 Mentorias' },
  { value: 'wrench', label: '🔧 Ferramentas' },
  { value: 'video', label: '🎬 Vídeos' },
  { value: 'star', label: '⭐ Premium' },
];

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onClose,
}: CategoryFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    display_order: 0,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        display_order: category.display_order,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        display_order: 0,
      });
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      if (category) {
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            icon: formData.icon || null,
            display_order: formData.display_order,
          })
          .eq('id', category.id);

        if (error) throw error;
        toast({ title: 'Categoria atualizada!' });
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            icon: formData.icon || null,
            display_order: formData.display_order,
          });

        if (error) throw error;
        toast({ title: 'Categoria criada!' });
      }

      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome da categoria *</Label>
            <Input
              id="cat-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cursos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-description">Descrição</Label>
            <Textarea
              id="cat-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional da categoria"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <Button
                  key={icon.value}
                  type="button"
                  variant={formData.icon === icon.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                >
                  {icon.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-order">Ordem de exibição</Label>
            <Input
              id="cat-order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                category ? 'Salvar' : 'Criar Categoria'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
