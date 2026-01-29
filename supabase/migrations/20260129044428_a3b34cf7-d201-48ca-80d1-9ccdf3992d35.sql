-- Create method_categories table for admin-defined categories
CREATE TABLE public.method_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create method_posts table for chat-style content
CREATE TABLE public.method_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.method_categories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  link_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.method_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.method_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for method_categories
CREATE POLICY "Admins can create categories"
  ON public.method_categories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
  ON public.method_categories FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
  ON public.method_categories FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VIP and Admins can view categories"
  ON public.method_categories FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_membership(auth.uid(), 'vip'::membership_tier)
  );

-- RLS Policies for method_posts
CREATE POLICY "Admins can create posts"
  ON public.method_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update posts"
  ON public.method_posts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete posts"
  ON public.method_posts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VIP and Admins can view posts"
  ON public.method_posts FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_membership(auth.uid(), 'vip'::membership_tier)
  );

-- Trigger for updated_at
CREATE TRIGGER update_method_posts_updated_at
  BEFORE UPDATE ON public.method_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();