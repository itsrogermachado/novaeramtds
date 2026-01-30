-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "System can update transactions" ON public.payment_transactions;

-- Create a more restrictive policy - users can only update their own pending transactions
CREATE POLICY "Users can update their own transactions"
ON public.payment_transactions
FOR UPDATE
USING (auth.uid() = user_id);