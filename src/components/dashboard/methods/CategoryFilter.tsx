import { Settings2, Calendar } from 'lucide-react';
import { MethodCategory } from '@/hooks/useMethodPosts';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CategoryFilterProps {
  categories: MethodCategory[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  isAdmin: boolean;
  onManageCategories: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  isAdmin,
  onManageCategories,
}: CategoryFilterProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <ScrollArea className="flex-1">
          <div className="flex gap-2 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "rounded-full whitespace-nowrap gap-1.5",
                    selectedCategory === null && "btn-premium"
                  )}
                  onClick={() => onSelectCategory(null)}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Recentes
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Veja os métodos mais recentes</p>
              </TooltipContent>
            </Tooltip>

            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                  style={isSelected
                    ? { backgroundColor: category.color, borderColor: category.color }
                    : { borderColor: `${category.color}50`, color: category.color }
                  }
                  onClick={() => onSelectCategory(category.id)}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={onManageCategories}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gerenciar categorias</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
