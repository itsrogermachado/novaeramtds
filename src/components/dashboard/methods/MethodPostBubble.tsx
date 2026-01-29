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
    <div className="flex flex-col gap-1 w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%] animate-fade-in">
      {/* Timestamp */}
      <span className="text-xs text-muted-foreground ml-2 sm:ml-3">
        {format(new Date(post.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
      </span>

      {/* Message bubble */}
      <div
        className={cn(
          "relative rounded-xl sm:rounded-2xl rounded-tl-md p-3 sm:p-4 shadow-md",
          "bg-gradient-to-br from-card to-muted/50",
          "border border-border/50",
          "min-w-0 overflow-hidden"
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
          <div className="mb-3 rounded-lg overflow-hidden -mx-1 sm:-mx-1">
            <img
              src={post.image_url}
              alt="Imagem do método"
              className="w-full h-auto max-w-full object-contain rounded-lg"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        )}

        {/* Video - Direct upload - above content */}
        {isDirectVideo && post.video_url && (
          <div className="mb-3 rounded-lg overflow-hidden -mx-1 sm:-mx-1">
            <video
              src={post.video_url}
              controls
              className="w-full h-auto max-w-full rounded-lg"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        )}

        {/* Video - YouTube embed - above content */}
        {youtubeEmbedUrl && (
          <div className="mb-3 rounded-lg overflow-hidden -mx-1 sm:-mx-1 aspect-video w-full">
            <iframe
              src={youtubeEmbedUrl}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vídeo do método"
            />
          </div>
        )}

        {/* Content */}
        <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed break-words" style={{ wordBreak: 'break-word' }}>
          {post.content}
        </p>

        {/* Links */}
        {post.links && post.links.length > 0 && (
          <div className="mt-3 space-y-1.5 sm:space-y-1">
            {post.links.map((link, index) => (
              <a
                key={link.id || index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="break-words" style={{ wordBreak: 'break-word' }}>{link.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 sm:h-7 text-xs gap-1 px-2 sm:px-3"
              onClick={() => onEdit(post)}
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden xs:inline sm:inline">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 sm:h-7 text-xs gap-1 px-2 sm:px-3 text-destructive hover:text-destructive"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden xs:inline sm:inline">Excluir</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
