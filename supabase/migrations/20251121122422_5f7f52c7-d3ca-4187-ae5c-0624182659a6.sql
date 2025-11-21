-- Allow public read access to tasks table
CREATE POLICY "Allow public read access to tasks"
ON public.tasks
FOR SELECT
USING (true);

-- Allow public insert access to tasks table
CREATE POLICY "Allow public insert access to tasks"
ON public.tasks
FOR INSERT
WITH CHECK (true);

-- Allow public read access to user_results table
CREATE POLICY "Allow public read access to user_results"
ON public.user_results
FOR SELECT
USING (true);

-- Allow public insert access to user_results table
CREATE POLICY "Allow public insert access to user_results"
ON public.user_results
FOR INSERT
WITH CHECK (true);