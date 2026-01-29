import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { MethodCategory } from '@/hooks/useMethodPosts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

interface CategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MethodCategory[];
  onCreate: (data: { name: string; color: string }) => Promise<unknown>;
  onUpdate: (data: { id: string; name: string; color: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function CategoryManageDialog({
  open,
  onOpenChange,
  categories,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManageDialogProps) {
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await onCreate({ name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      toast({ title: 'Categoria criada!' });
    } catch {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await onUpdate({ id, name: editName.trim(), color: editColor });
      setEditingId(null);
      toast({ title: 'Categoria atualizada!' });
    } catch {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast({ title: 'Categoria excluída!' });
    } catch {
      toast({ title: 'Erro ao excluir categoria', variant: 'destructive' });
    }
  };

  const startEdit = (category: MethodCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* New category form */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Nova categoria</label>
              <Input
                placeholder="Nome da categoria"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex gap-1">
              {PRESET_COLORS.slice(0, 4).map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: newColor === color ? 'white' : 'transparent',
                    boxShadow: newColor === color ? `0 0 0 2px ${color}` : 'none',
                  }}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
            <Button
              size="icon"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="btn-premium"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Categories list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma categoria criada ainda.
              </p>
            )}
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                {editingId === category.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 flex-1"
                    />
                    <div className="flex gap-1">
                      {PRESET_COLORS.slice(0, 4).map((color) => (
                        <button
                          key={color}
                          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor: editColor === color ? 'white' : 'transparent',
                            boxShadow: editColor === color ? `0 0 0 2px ${color}` : 'none',
                          }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleUpdate(category.id)}
                    >
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 text-sm">{category.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
