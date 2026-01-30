import { ProductCategory } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GraduationCap, BookOpen, Users, Wrench, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  categories: ProductCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Wrench: <Wrench className="h-4 w-4" />,
};

export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "shrink-0 gap-2",
            selectedCategory === null && "btn-premium"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Todos
        </Button>

        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "shrink-0 gap-2",
              selectedCategory === category.id && "btn-premium"
            )}
          >
            {category.icon && iconMap[category.icon]}
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
