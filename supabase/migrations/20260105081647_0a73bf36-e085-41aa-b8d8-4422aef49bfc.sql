-- Allow users to delete only their own methods
CREATE POLICY "Users can delete their own methods"
ON public.operation_methods
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);