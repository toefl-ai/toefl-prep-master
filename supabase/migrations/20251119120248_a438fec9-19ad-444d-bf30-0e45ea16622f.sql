-- Create enum for task types
CREATE TYPE task_type AS ENUM ('lecture', 'conversation');

-- Create tasks table to store generated TOEFL practice tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type task_type NOT NULL,
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  audio_url TEXT,
  questions JSONB NOT NULL, -- Array of question objects with text, options, correct_answer, explanation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read tasks (public practice content)
CREATE POLICY "Anyone can read tasks"
  ON tasks
  FOR SELECT
  USING (true);

-- Create user_results table for tracking quiz attempts
CREATE TABLE user_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_answers JSONB NOT NULL, -- Array of user's answers
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user results
CREATE INDEX idx_user_results_task ON user_results(task_id);
CREATE INDEX idx_user_results_created ON user_results(created_at DESC);

-- Enable RLS
ALTER TABLE user_results ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create results (for now, before auth)
CREATE POLICY "Anyone can create results"
  ON user_results
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read results
CREATE POLICY "Anyone can read results"
  ON user_results
  FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();