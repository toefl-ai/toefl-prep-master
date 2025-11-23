-- Add user_id column to user_results table
ALTER TABLE public.user_results 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public insert access to user_results" ON public.user_results;
DROP POLICY IF EXISTS "Allow public read access to user_results" ON public.user_results;
DROP POLICY IF EXISTS "Anyone can create results" ON public.user_results;
DROP POLICY IF EXISTS "Anyone can read results" ON public.user_results;

-- Create secure RLS policies that restrict access to own results only
CREATE POLICY "Users can view their own results"
ON public.user_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
ON public.user_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update existing rows to have a null user_id (will need cleanup after auth is implemented)
-- Note: Existing records without user_id won't be accessible until assigned to a user