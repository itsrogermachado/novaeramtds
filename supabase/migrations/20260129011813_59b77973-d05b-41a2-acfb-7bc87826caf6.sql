-- Create tutorials table
CREATE TABLE public.tutorials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    duration_minutes INTEGER,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view tutorials
CREATE POLICY "All authenticated users can view tutorials"
ON public.tutorials
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can create tutorials
CREATE POLICY "Admins can create tutorials"
ON public.tutorials
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update tutorials
CREATE POLICY "Admins can update tutorials"
ON public.tutorials
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete tutorials
CREATE POLICY "Admins can delete tutorials"
ON public.tutorials
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for tutorial videos and thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tutorials',
    'tutorials',
    true,
    104857600, -- 100MB limit for videos
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for tutorials bucket
-- Anyone can view tutorial files (public bucket)
CREATE POLICY "Tutorial files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tutorials');

-- Only admins can upload to tutorials bucket
CREATE POLICY "Admins can upload tutorial files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update tutorial files
CREATE POLICY "Admins can update tutorial files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete tutorial files
CREATE POLICY "Admins can delete tutorial files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tutorials' AND public.has_role(auth.uid(), 'admin'));