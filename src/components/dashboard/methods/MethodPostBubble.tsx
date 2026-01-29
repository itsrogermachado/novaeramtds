import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link2, Pencil, Trash2 } from 'lucide-react';
import { MethodPost } from '@/hooks/useMethodPosts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MethodPostBubbleProps {
  post: MethodPost;
  isAdmin: boolean;
  onEdit: (post: MethodPost) => void;
  onDelete: (id: string) => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

function isVideoFile(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

export function MethodPostBubble({ post, isAdmin, onEdit, onDelete }: MethodPostBubbleProps) {
  const categoryColor = post.category?.color || '#3B82F6';
  const youtubeEmbedUrl = post.video_url ? getYouTubeEmbedUrl(post.video_url) : null;
  const isDirectVideo = post.video_url && isVideoFile(post.video_url);

  return (
    <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[70%] animate-fade-in">
      {/* Timestamp */}
      <span className="text-xs text-muted-foreground ml-3">
        {format(new Date(post.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
      </span>

      {/* Message bubble */}
      <div
        className={cn(
          "relative rounded-2xl rounded-tl-md p-4 shadow-md",
          "bg-gradient-to-br from-card to-muted/50",
          "border border-border/50"
        )}
        style={{
          borderLeftColor: categoryColor,
          borderLeftWidth: '4px',
        }}
      >
        {/* Category badge */}
        {post.category && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {post.category.name}
          </span>
        )}

        {/* Image - above content */}
        {post.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden -mx-1">
            <img
              src={post.image_url}
              alt="Imagem do método"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Video - Direct upload - above content */}
        {isDirectVideo && post.video_url && (
          <div className="mb-3 rounded-lg overflow-hidden -mx-1">
            <video
              src={post.video_url}
              controls
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Video - YouTube embed - above content */}
        {youtubeEmbedUrl && (
          <div className="mb-3 rounded-lg overflow-hidden aspect-video -mx-1">
            <iframe
              src={youtubeEmbedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vídeo do método"
            />
          </div>
        )}

        {/* Content */}
        <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Links */}
        {post.links && post.links.length > 0 && (
          <div className="mt-3 space-y-1">
            {post.links.map((link, index) => (
              <a
                key={link.id || index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                {link.title}
              </a>
            ))}
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-1 mt-3 pt-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onEdit(post)}
            >
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
