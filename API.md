# Kanban API Documentation

## Overview

The Nova Dashboard Kanban API provides real-time task management stored in Supabase. Tasks are automatically synced across all clients without requiring commits or deploys.

**Base URL:** `https://dashboard.arialabs.ai/api`

## Endpoints

### GET /api/kanban

Fetch all kanban tasks.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "task_id": "DATA-12",
      "title": "Refresh FEC finance data",
      "description": "Current data has all zeros - OpenFEC API key available",
      "assignee": "Nova",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2026-02-06T18:00:00Z",
      "updated_at": "2026-02-06T19:00:00Z",
      "metadata": {
        "url": "https://api.open.fec.gov"
      }
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST /api/kanban

Create or update a task. If `task_id` already exists, the task will be updated (upsert).

**Request Body:**
```json
{
  "task_id": "DATA-12",
  "title": "Refresh FEC finance data",
  "description": "Current data has all zeros - OpenFEC API key available",
  "assignee": "Nova",
  "status": "in_progress",
  "priority": "high",
  "metadata": {
    "url": "https://api.open.fec.gov",
    "steps": ["Fetch data", "Transform", "Update DB"]
  }
}
```

**Required Fields:**
- `task_id` (string) - Unique task identifier (e.g., "DATA-12")
- `title` (string) - Task title
- `assignee` (string) - Who the task is assigned to
- `status` (string) - One of: `"backlog"`, `"in_progress"`, `"done"`, `"blocked"`
- `priority` (string) - One of: `"high"`, `"medium"`, `"low"`

**Optional Fields:**
- `description` (string) - Task description or notes
- `metadata` (object) - Any additional task data (flexible JSONB)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "task_id": "DATA-12",
    "title": "Refresh FEC finance data",
    "description": "Current data has all zeros - OpenFEC API key available",
    "assignee": "Nova",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2026-02-06T18:00:00Z",
    "updated_at": "2026-02-06T19:00:00Z",
    "metadata": {
      "url": "https://api.open.fec.gov",
      "steps": ["Fetch data", "Transform", "Update DB"]
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing required fields, invalid status/priority)
- `500` - Server error

---

## Status Values

| Status | Description |
|--------|-------------|
| `backlog` | Task is queued and not yet started |
| `in_progress` | Task is currently being worked on |
| `done` | Task is completed |
| `blocked` | Task is blocked by dependencies or issues |

## Priority Values

| Priority | Description |
|----------|-------------|
| `high` | Urgent task, should be addressed soon |
| `medium` | Standard priority |
| `low` | Nice-to-have, lower priority |

## Examples

### Create a new task

```bash
curl -X POST https://dashboard.arialabs.ai/api/kanban \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "LEG-5",
    "title": "Add vote explanations",
    "description": "Add context for why votes matter",
    "assignee": "Nova",
    "status": "backlog",
    "priority": "medium",
    "metadata": {
      "repo": "accountability-dashboard"
    }
  }'
```

### Update task status

```bash
curl -X POST https://dashboard.arialabs.ai/api/kanban \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "LEG-5",
    "title": "Add vote explanations",
    "description": "Add context for why votes matter",
    "assignee": "Nova",
    "status": "in_progress",
    "priority": "medium"
  }'
```

### Mark task as done

```bash
curl -X POST https://dashboard.arialabs.ai/api/kanban \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "LEG-5",
    "title": "Add vote explanations",
    "description": "Added context and impact analysis",
    "assignee": "Nova",
    "status": "done",
    "priority": "medium",
    "metadata": {
      "outcome": "✅ Deployed with 258 votes enriched"
    }
  }'
```

### Fetch all tasks

```bash
curl https://dashboard.arialabs.ai/api/kanban
```

### Filter tasks by status (client-side)

```javascript
fetch('https://dashboard.arialabs.ai/api/kanban')
  .then(res => res.json())
  .then(data => {
    const inProgress = data.data.filter(t => t.status === 'in_progress');
    console.log('Active tasks:', inProgress);
  });
```

## Database Schema

Tasks are stored in the `kanban_tasks` table in Supabase:

```sql
CREATE TABLE kanban_tasks (
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
```

## Security

- **RLS Policies:** Anonymous read access is enabled, authenticated write access
- **CORS:** Wide-open CORS for dashboard access from any origin
- **Rate Limiting:** Managed by Cloudflare
- **API Keys:** Stored as Cloudflare Pages secrets (not exposed to clients)

## Migration

To migrate existing `kanban.json` data to Supabase:

```bash
npm run migrate
```

This will:
1. Read `kanban.json`
2. Transform tasks to the new schema
3. POST each task to the API
4. Report success/errors

## Testing

Run the test suite:

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

## Deployment

The API is deployed automatically via GitHub Actions when pushing to `main`. Environment variables are managed via Cloudflare Pages secrets:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key

## Troubleshooting

### Task not updating
- Check that `task_id` matches exactly (case-sensitive)
- Verify the request body includes all required fields
- Check browser console for CORS errors

### 500 errors
- Verify Supabase credentials are set in Cloudflare Pages
- Check Supabase project is accessible
- Review RLS policies in Supabase dashboard

### Tasks not appearing on dashboard
- Clear browser cache and reload
- Check that the API is returning data: `curl https://dashboard.arialabs.ai/api/kanban`
- Verify the frontend is fetching from `/api/kanban` not `kanban.json`

## Support

For issues or questions, contact Jeremy Spofford or file an issue in the GitHub repo.
