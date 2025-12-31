import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateFilterProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

export function DateFilter({ dateRange, onDateRangeChange }: DateFilterProps) {
  const setToday = () => {
    const now = new Date();
    onDateRangeChange({
      start: startOfDay(now),
      end: endOfDay(now),
    });
  };

  const setThisMonth = () => {
    const now = new Date();
    onDateRangeChange({
      start: startOfMonth(now),
      end: endOfMonth(now),
    });
  };

  const isToday = 
    format(dateRange.start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
    format(dateRange.end, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const isThisMonth = 
    format(dateRange.start, 'yyyy-MM-dd') === format(startOfMonth(new Date()), 'yyyy-MM-dd') &&
    format(dateRange.end, 'yyyy-MM-dd') === format(endOfMonth(new Date()), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isToday ? "default" : "outline"}
        size="sm"
        onClick={setToday}
        className="text-sm"
      >
        Hoje
      </Button>

      <Button
        variant={isThisMonth ? "default" : "outline"}
        size="sm"
        onClick={setThisMonth}
        className="text-sm"
      >
        Este mês
      </Button>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal gap-2",
                !dateRange.start && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.start}
              onSelect={(date) => date && onDateRangeChange({ ...dateRange, start: date })}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal gap-2",
                !dateRange.end && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.end}
              onSelect={(date) => date && onDateRangeChange({ ...dateRange, end: date })}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
