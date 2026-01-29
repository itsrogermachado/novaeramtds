-- Update the tutorials bucket to allow files up to 10GB (10737418240 bytes)
UPDATE storage.buckets 
SET file_size_limit = 10737418240 
WHERE id = 'tutorials';