import { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMethodCategories, useMethodPosts, MethodPost } from '@/hooks/useMethodPosts';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryFilter } from './methods/CategoryFilter';
import { MethodPostBubble } from './methods/MethodPostBubble';
import { MethodPostDialog } from './methods/MethodPostDialog';
import { CategoryManageDialog } from './methods/CategoryManageDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

export function MethodsTab() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MethodPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useMethodCategories();

  const {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
  } = useMethodPosts(selectedCategory || undefined);

  const handleSubmitPost = async (data: {
    category_id: string;
    content: string;
    image_url?: string;
    video_url?: string;
    link_url?: string;
    link_text?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingPost) {
        await updatePost({
          id: editingPost.id,
          ...data,
          image_url: data.image_url || null,
          video_url: data.video_url || null,
          link_url: data.link_url || null,
          link_text: data.link_text || null,
        });
        toast({ title: 'Método atualizado!' });
      } else {
        await createPost(data);
        toast({ title: 'Método publicado!' });
      }
      setEditingPost(null);
    } catch {
      toast({ title: 'Erro ao salvar método', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    try {
      await deletePost(deletingPostId);
      toast({ title: 'Método excluído!' });
    } catch {
      toast({ title: 'Erro ao excluir método', variant: 'destructive' });
    } finally {
      setDeletingPostId(null);
    }
  };

  const openEditDialog = (post: MethodPost) => {
    setEditingPost(post);
    setPostDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingPost(null);
    setPostDialogOpen(true);
  };

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Métodos
            </CardTitle>
            <CardDescription className="mt-1">
              Métodos organizados como uma conversa — escolha um tema e aprenda do seu jeito.
            </CardDescription>
          </div>

          {isAdmin && (
            <Button onClick={openNewDialog} className="gap-2 btn-premium">
              <Plus className="h-4 w-4" />
              Novo método
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category filters */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isAdmin={isAdmin}
          onManageCategories={() => setCategoryDialogOpen(true)}
        />

        {/* Posts feed */}
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {selectedCategory
                    ? 'Nenhum método nesta categoria ainda.'
                    : 'Nenhum método publicado ainda.'}
                </p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={openNewDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Publicar primeiro método
                  </Button>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <MethodPostBubble
                  key={post.id}
                  post={post}
                  isAdmin={isAdmin}
                  onEdit={openEditDialog}
                  onDelete={setDeletingPostId}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Dialogs */}
      <MethodPostDialog
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
        post={editingPost}
        categories={categories}
        onSubmit={handleSubmitPost}
        isSubmitting={isSubmitting}
      />

      <CategoryManageDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      <ConfirmDeleteDialog
        open={!!deletingPostId}
        onOpenChange={(open) => !open && setDeletingPostId(null)}
        onConfirm={handleDeletePost}
        title="Excluir método"
        description="Tem certeza que deseja excluir este método? Esta ação não pode ser desfeita."
      />
    </Card>
  );
}
