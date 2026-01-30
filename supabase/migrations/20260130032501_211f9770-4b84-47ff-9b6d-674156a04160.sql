-- Drop method_links first (depends on method_posts)
DROP TABLE IF EXISTS public.method_links CASCADE;

-- Drop method_posts (depends on method_categories)
DROP TABLE IF EXISTS public.method_posts CASCADE;

-- Drop method_categories
DROP TABLE IF EXISTS public.method_categories CASCADE;

-- Drop user_memberships (no longer used since all features are unlocked)
DROP TABLE IF EXISTS public.user_memberships CASCADE;

-- Drop the membership_tier enum type
DROP TYPE IF EXISTS public.membership_tier CASCADE;

-- Drop the get_membership_tier function
DROP FUNCTION IF EXISTS public.get_membership_tier(uuid);

-- Drop the has_membership function
DROP FUNCTION IF EXISTS public.has_membership(uuid, membership_tier);