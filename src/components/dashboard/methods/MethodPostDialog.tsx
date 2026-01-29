import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { MethodCategory, MethodPost, MethodLink } from '@/hooks/useMethodPosts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MethodLinksEditor } from './MethodLinksEditor';
import { useToast } from '@/hooks/use-toast';

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

const formSchema = z.object({
  category_id: z.string().min(1, 'Selecione uma categoria'),
  content: z.string().min(1, 'O conteúdo é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface MethodPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: MethodPost | null;
  categories: MethodCategory[];
  onSubmit: (data: {
    category_id: string;
    content: string;
    image_url?: string | null;
    video_url?: string | null;
    links?: MethodLink[];
  }) => Promise<void>;
  onCreateCategory: (data: { name: string; color: string }) => Promise<MethodCategory>;
  uploadFile: (file: File, type: 'image' | 'video') => Promise<string>;
  isSubmitting: boolean;
}

export function MethodPostDialog({
  open,
  onOpenChange,
  post,
  categories,
  onSubmit,
  onCreateCategory,
  uploadFile,
  isSubmitting,
}: MethodPostDialogProps) {
  const { toast } = useToast();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [links, setLinks] = useState<MethodLink[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: '',
      content: '',
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        category_id: post.category_id,
        content: post.content,
      });
      setImageUrl(post.image_url);
      setVideoUrl(post.video_url);
      setLinks(post.links || []);
    } else {
      form.reset({
        category_id: categories[0]?.id || '',
        content: '',
      });
      setImageUrl(null);
      setVideoUrl(null);
      setLinks([]);
    }
    setShowNewCategory(false);
    setNewCategoryName('');
  }, [post, categories, form, open]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const newCategory = await onCreateCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      form.setValue('category_id', newCategory.id);
      setShowNewCategory(false);
      setNewCategoryName('');
      toast({ title: 'Categoria criada!' });
    } catch {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione um arquivo de imagem', variant: 'destructive' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await uploadFile(file, 'image');
      setImageUrl(url);
      toast({ title: 'Imagem carregada!' });
    } catch {
      toast({ title: 'Erro ao carregar imagem', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      toast({ title: 'Selecione um arquivo de vídeo', variant: 'destructive' });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const url = await uploadFile(file, 'video');
      setVideoUrl(url);
      toast({ title: 'Vídeo carregado!' });
    } catch {
      toast({ title: 'Erro ao carregar vídeo', variant: 'destructive' });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      category_id: data.category_id,
      content: data.content,
      image_url: imageUrl,
      video_url: videoUrl,
      links,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? 'Editar método' : 'Novo método'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Category field with inline create */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  {!showNewCategory ? (
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewCategory(true)}
                        title="Criar nova categoria"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da categoria"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.slice(0, 4).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: color,
                                borderColor: newCategoryColor === color ? 'white' : 'transparent',
                                boxShadow: newCategoryColor === color ? `0 0 0 2px ${color}` : 'none',
                              }}
                              onClick={() => setNewCategoryColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim() || isCreatingCategory}
                          className="flex-1"
                        >
                          {isCreatingCategory && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Criar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewCategory(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva o conteúdo do método..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image upload */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Imagem (opcional)
              </FormLabel>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setImageUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Carregar imagem
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Video upload */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Vídeo (opcional)
              </FormLabel>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
              {videoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <video
                    src={videoUrl}
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setVideoUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                    Vídeo carregado
                  </span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                >
                  {isUploadingVideo ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Carregar vídeo
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Links */}
            <MethodLinksEditor links={links} onChange={setLinks} />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="btn-premium">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {post ? 'Salvar' : 'Publicar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
