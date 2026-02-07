-- Add icebox status for backlog/ideas
ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_status_check;
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_status_check 
  CHECK (status IN ('icebox', 'backlog', 'in_progress', 'done', 'blocked'));
