import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateFilterProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  children?: React.ReactNode;
}

export function DateFilter({ dateRange, onDateRangeChange, children }: DateFilterProps) {
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

  const setAllTime = () => {
    onDateRangeChange({
      start: subYears(new Date(), 10), // 10 years back
      end: endOfDay(new Date()),
    });
  };

  const isToday = 
    format(dateRange.start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
    format(dateRange.end, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const isThisMonth = 
    format(dateRange.start, 'yyyy-MM-dd') === format(startOfMonth(new Date()), 'yyyy-MM-dd') &&
    format(dateRange.end, 'yyyy-MM-dd') === format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const isAllTime = 
    format(dateRange.start, 'yyyy-MM-dd') === format(subYears(new Date(), 10), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col xs:flex-row flex-wrap items-start xs:items-center gap-2 md:gap-3">
      {/* Quick filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={isToday ? "default" : "outline"}
          size="sm"
          onClick={setToday}
          className="text-xs md:text-sm h-8 px-2.5 sm:px-3"
        >
          Hoje
        </Button>

        <Button
          variant={isThisMonth ? "default" : "outline"}
          size="sm"
          onClick={setThisMonth}
          className="text-xs md:text-sm h-8 px-2.5 sm:px-3"
        >
          Mês
        </Button>

        <Button
          variant={isAllTime ? "default" : "outline"}
          size="sm"
          onClick={setAllTime}
          className="text-xs md:text-sm h-8 px-2.5 sm:px-3"
        >
          Total
        </Button>
      </div>

      {/* Date range pickers */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal gap-1 sm:gap-1.5 md:gap-2 text-xs md:text-sm h-8 px-2 sm:px-2.5",
                !dateRange.start && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              {format(dateRange.start, "dd/MM/yy", { locale: ptBR })}
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

        <span className="text-xs md:text-sm text-muted-foreground">-</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal gap-1 sm:gap-1.5 md:gap-2 text-xs md:text-sm h-8 px-2 sm:px-2.5",
                !dateRange.end && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              {format(dateRange.end, "dd/MM/yy", { locale: ptBR })}
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

      {/* AI Assistant slot */}
      {children}
    </div>
  );
}
