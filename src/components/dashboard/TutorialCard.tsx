import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Clock, Trash2, Pencil, Video, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { Tutorial } from '@/hooks/useTutorials';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { cn } from '@/lib/utils';

interface TutorialCardProps {
  tutorial: Tutorial;
  onEdit?: (tutorial: Tutorial) => void;
  onDelete?: (id: string) => void;
}

export function TutorialCard({ tutorial, onEdit, onDelete }: TutorialCardProps) {
  const { isAdmin } = useAuth();
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(tutorial.id);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="premium-shadow gradient-border group hover-3d overflow-hidden">
        {/* Thumbnail / Video Preview */}
        <div 
          className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
          onClick={() => setVideoDialogOpen(true)}
        >
          {tutorial.thumbnail_url ? (
            <img 
              src={tutorial.thumbnail_url} 
              alt={tutorial.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Video className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="h-6 w-6 text-foreground ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          {tutorial.duration_minutes && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(tutorial.duration_minutes)}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="mb-2 text-xs">
                {tutorial.category}
              </Badge>
              <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                {tutorial.title}
              </h3>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(tutorial);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>

          {tutorial.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tutorial.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-display pr-8">{tutorial.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2 space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={tutorial.video_url}
                controls
                autoPlay
                className="w-full h-full"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>
            
            {tutorial.description && (
              <p className="text-sm text-muted-foreground">
                {tutorial.description}
              </p>
            )}

            {/* Links Section */}
            {tutorial.links && tutorial.links.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <LinkIcon className="h-4 w-4" />
                  Links Relacionados
                </div>
                <div className="grid gap-2">
                  {tutorial.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="flex-1 text-sm truncate">{link.title}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                        {link.url.replace(/^https?:\/\//, '').split('/')[0]}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Tutorial"
        description="Tem certeza que deseja excluir este tutorial? Esta ação não pode ser desfeita."
      />
    </>
  );
}
