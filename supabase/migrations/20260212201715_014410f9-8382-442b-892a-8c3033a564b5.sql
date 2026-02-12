
ALTER TABLE public.cooperations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Initialize updated_at with created_at for existing records
UPDATE public.cooperations SET updated_at = created_at;

-- Create trigger to auto-update on changes
CREATE TRIGGER update_cooperations_updated_at
BEFORE UPDATE ON public.cooperations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
