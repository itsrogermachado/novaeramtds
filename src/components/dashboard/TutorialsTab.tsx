import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Video, Filter } from 'lucide-react';
import { useTutorials, Tutorial, TutorialInput } from '@/hooks/useTutorials';
import { useAuth } from '@/contexts/AuthContext';
import { TutorialCard } from './TutorialCard';
import { TutorialDialog } from './TutorialDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function TutorialsTab() {
  const { tutorials, categories, isLoading, createTutorial, updateTutorial, deleteTutorial, uploadFile } = useTutorials();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTutorials = useMemo(() => {
    let filtered = tutorials;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(query) || 
             t.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    return filtered;
  }, [tutorials, searchQuery, selectedCategory]);

  const handleSubmit = async (data: TutorialInput) => {
    if (editingTutorial) {
      const { error } = await updateTutorial(editingTutorial.id, data);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return { error };
      }
      toast({ title: 'Tutorial atualizado com sucesso!' });
      return { error: null };
    } else {
      const { error } = await createTutorial(data);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return { error };
      }
      toast({ title: 'Tutorial criado com sucesso!' });
      return { error: null };
    }
  };

  const handleEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteTutorial(id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tutorial excluído com sucesso!' });
    }
  };

  const handleOpenNew = () => {
    setEditingTutorial(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tutoriais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botão Admin */}
        {isAdmin && (
          <Button onClick={handleOpenNew} className="gap-2 btn-premium text-primary-foreground">
            <Plus className="h-4 w-4" />
            Novo Tutorial
          </Button>
        )}
      </div>

      {/* Filtros de categoria */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer transition-colors"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Grid de Tutoriais */}
      {filteredTutorials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || selectedCategory ? 'Nenhum tutorial encontrado' : 'Nenhum tutorial disponível'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {searchQuery || selectedCategory 
              ? 'Tente ajustar sua busca ou filtros.'
              : isAdmin 
                ? 'Clique em "Novo Tutorial" para adicionar conteúdo.'
                : 'Os tutoriais aparecerão aqui quando forem adicionados.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTutorials.map((tutorial, index) => (
            <div 
              key={tutorial.id}
              className="animate-slide-up-fade"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TutorialCard
                tutorial={tutorial}
                onEdit={isAdmin ? handleEdit : undefined}
                onDelete={isAdmin ? handleDelete : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar */}
      <TutorialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tutorial={editingTutorial}
        categories={categories}
        onSubmit={handleSubmit}
        onUploadFile={uploadFile}
      />
    </div>
  );
}
