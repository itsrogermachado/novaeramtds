-- Update goal_type enum to include 'weekly'
ALTER TYPE goal_type ADD VALUE IF NOT EXISTS 'weekly';