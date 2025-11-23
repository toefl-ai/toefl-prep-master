-- Drop all public insert policies on tasks table
DROP POLICY IF EXISTS "Allow public insert access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can create tasks" ON public.tasks;

-- Drop existing public read policies
DROP POLICY IF EXISTS "Allow public read access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can read tasks" ON public.tasks;

-- Create secure policy: only authenticated users can read tasks
CREATE POLICY "Authenticated users can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

-- Note: INSERT will only be possible via Edge Functions using service_role key
-- This prevents public users from injecting malicious content