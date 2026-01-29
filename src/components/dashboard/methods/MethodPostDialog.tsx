import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { MethodCategory, MethodPost } from '@/hooks/useMethodPosts';
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

const formSchema = z.object({
  category_id: z.string().min(1, 'Selecione uma categoria'),
  content: z.string().min(1, 'O conteúdo é obrigatório'),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  link_url: z.string().url('URL inválida').optional().or(z.literal('')),
  link_text: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MethodPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: MethodPost | null;
  categories: MethodCategory[];
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function MethodPostDialog({
  open,
  onOpenChange,
  post,
  categories,
  onSubmit,
  isSubmitting,
}: MethodPostDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: '',
      content: '',
      image_url: '',
      video_url: '',
      link_url: '',
      link_text: '',
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        category_id: post.category_id,
        content: post.content,
        image_url: post.image_url || '',
        video_url: post.video_url || '',
        link_url: post.link_url || '',
        link_text: post.link_text || '',
      });
    } else {
      form.reset({
        category_id: categories[0]?.id || '',
        content: '',
        image_url: '',
        video_url: '',
        link_url: '',
        link_text: '',
      });
    }
  }, [post, categories, form]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      image_url: data.image_url || undefined,
      video_url: data.video_url || undefined,
      link_url: data.link_url || undefined,
      link_text: data.link_text || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {post ? 'Editar método' : 'Novo método'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva o conteúdo do método..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da imagem (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do vídeo YouTube (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="link_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do link (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do link</FormLabel>
                    <FormControl>
                      <Input placeholder="Clique aqui" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
