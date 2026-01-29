import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, Video, Image, Loader2 } from 'lucide-react';
import { Tutorial, TutorialInput, TutorialLinkInput } from '@/hooks/useTutorials';
import { TutorialLinksEditor } from './TutorialLinksEditor';
import { cn } from '@/lib/utils';

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorial: Tutorial | null;
  categories: string[];
  onSubmit: (data: TutorialInput) => Promise<{ error: Error | null }>;
  onUploadFile: (file: File, path: string) => Promise<{ error: Error | null; url: string | null }>;
}

const DEFAULT_CATEGORIES = ['Geral', 'Operações', 'Métodos', 'Finanças', 'Dicas'];

export function TutorialDialog({
  open,
  onOpenChange,
  tutorial,
  categories,
  onSubmit,
  onUploadFile,
}: TutorialDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Geral');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [links, setLinks] = useState<TutorialLinkInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

  useEffect(() => {
    if (open) {
      if (tutorial) {
        setTitle(tutorial.title);
        setDescription(tutorial.description || '');
        setCategory(tutorial.category);
        setDurationMinutes(tutorial.duration_minutes?.toString() || '');
        setVideoUrl(tutorial.video_url);
        setThumbnailUrl(tutorial.thumbnail_url || '');
        setLinks(tutorial.links?.map(l => ({
          title: l.title,
          url: l.url,
          display_order: l.display_order
        })) || []);
      } else {
        setTitle('');
        setDescription('');
        setCategory('Geral');
        setDurationMinutes('');
        setVideoUrl('');
        setThumbnailUrl('');
        setLinks([]);
      }
      setNewCategory('');
    }
  }, [open, tutorial]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const { url, error } = await onUploadFile(file, 'videos');
    
    if (!error && url) {
      setVideoUrl(url);
    }
    
    setUploadingVideo(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    const { url, error } = await onUploadFile(file, 'thumbnails');
    
    if (!error && url) {
      setThumbnailUrl(url);
    }
    
    setUploadingThumbnail(false);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !videoUrl) return;

    setIsSubmitting(true);

    const finalCategory = newCategory.trim() || category;

    const { error } = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category: finalCategory,
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl || undefined,
      links: links,
    });

    setIsSubmitting(false);

    if (!error) {
      onOpenChange(false);
    }
  };

  const isEditing = !!tutorial;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Editar Tutorial' : 'Novo Tutorial'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Como registrar uma operação"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o conteúdo do tutorial..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Ou criar nova..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              placeholder="Ex: 10"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          {/* Upload de Vídeo */}
          <div className="space-y-2">
            <Label>Vídeo *</Label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleVideoUpload}
            />
            
            {videoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <video
                  src={videoUrl}
                  className="w-full aspect-video object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setVideoUrl('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  uploadingVideo 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {uploadingVideo ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Enviando vídeo...</span>
                  </>
                ) : (
                  <>
                    <Video className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para enviar um vídeo</span>
                    <span className="text-xs text-muted-foreground/70">MP4, WebM ou MOV (máx 10GB)</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Upload de Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail (opcional)</Label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleThumbnailUpload}
            />
            
            {thumbnailUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border w-fit">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="h-32 w-auto object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setThumbnailUrl('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => !uploadingThumbnail && thumbnailInputRef.current?.click()}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  uploadingThumbnail 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {uploadingThumbnail ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <Image className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploadingThumbnail ? 'Enviando...' : 'Adicionar thumbnail'}
                </span>
              </div>
            )}
          </div>

          {/* Links Editor */}
          <TutorialLinksEditor links={links} onChange={setLinks} />

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !videoUrl}
              className="btn-premium text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                'Salvar Alterações'
              ) : (
                'Criar Tutorial'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
