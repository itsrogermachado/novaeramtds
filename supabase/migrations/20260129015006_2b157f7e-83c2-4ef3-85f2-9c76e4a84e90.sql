-- Create table for tutorial links
CREATE TABLE public.tutorial_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_links ENABLE ROW LEVEL SECURITY;

-- Policies: same as tutorials (admins manage, all authenticated view)
CREATE POLICY "All authenticated users can view tutorial links"
ON public.tutorial_links
FOR SELECT
USING (true);

CREATE POLICY "Admins can create tutorial links"
ON public.tutorial_links
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tutorial links"
ON public.tutorial_links
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tutorial links"
ON public.tutorial_links
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster lookups
CREATE INDEX idx_tutorial_links_tutorial_id ON public.tutorial_links(tutorial_id);