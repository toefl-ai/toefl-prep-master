-- Create policy to allow authenticated users to insert tasks
CREATE POLICY "Authenticated users can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (true);