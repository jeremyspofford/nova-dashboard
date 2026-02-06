-- Create kanban_tasks table
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'in_progress', 'done', 'blocked')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on task_id for faster lookups
CREATE INDEX idx_kanban_tasks_task_id ON public.kanban_tasks(task_id);

-- Create index on status for filtering
CREATE INDEX idx_kanban_tasks_status ON public.kanban_tasks(status);

-- Create index on assignee for filtering
CREATE INDEX idx_kanban_tasks_assignee ON public.kanban_tasks(assignee);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kanban_tasks_updated_at
  BEFORE UPDATE ON public.kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anonymous read access (for dashboard viewing)
CREATE POLICY "Allow anonymous read access"
  ON public.kanban_tasks
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated read access
CREATE POLICY "Allow authenticated read access"
  ON public.kanban_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated insert
CREATE POLICY "Allow authenticated insert"
  ON public.kanban_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated update
CREATE POLICY "Allow authenticated update"
  ON public.kanban_tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated delete
CREATE POLICY "Allow authenticated delete"
  ON public.kanban_tasks
  FOR DELETE
  TO authenticated
  USING (true);
