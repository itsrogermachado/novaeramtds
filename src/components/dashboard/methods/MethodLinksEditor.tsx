import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { MethodLink } from '@/hooks/useMethodPosts';

interface MethodLinksEditorProps {
  links: MethodLink[];
  onChange: (links: MethodLink[]) => void;
}

export function MethodLinksEditor({ links, onChange }: MethodLinksEditorProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    onChange([
      ...links,
      { title: newTitle.trim(), url, display_order: links.length }
    ]);
    setNewTitle('');
    setNewUrl('');
  };

  const removeLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    onChange(updated.map((link, i) => ({ ...link, display_order: i })));
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;

    const newLinks = [...links];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    onChange(newLinks.map((link, i) => ({ ...link, display_order: i })));
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4" />
        Links Relacionados
      </Label>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => moveLink(index, 'up')}
                  disabled={index === 0}
                >
                  <span className="text-[10px] text-muted-foreground">▲</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => moveLink(index, 'down')}
                  disabled={index === links.length - 1}
                >
                  <span className="text-[10px] text-muted-foreground">▼</span>
                </Button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{link.title}</p>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={() => removeLink(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Título do link"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-9"
          />
          <Input
            placeholder="URL (ex: https://example.com)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
          disabled={!newTitle.trim() || !newUrl.trim()}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Link
        </Button>
      </div>

      {links.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Adicione links para materiais ou recursos relacionados ao método.
        </p>
      )}
    </div>
  );
}
