-- Create storage bucket for method uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('methods', 'methods', true);

-- Allow authenticated users to view files
CREATE POLICY "Public can view method files"
ON storage.objects FOR SELECT
USING (bucket_id = 'methods');

-- Allow admins to upload files
CREATE POLICY "Admins can upload method files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'methods' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete method files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'methods' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create method_links table for multiple links per post
CREATE TABLE public.method_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id UUID NOT NULL REFERENCES public.method_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.method_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for method_links
CREATE POLICY "Admins can create method links"
ON public.method_links FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update method links"
ON public.method_links FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete method links"
ON public.method_links FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VIP and Admins can view method links"
ON public.method_links FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_membership(auth.uid(), 'vip'::membership_tier)
);