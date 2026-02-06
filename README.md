# 📱 Nova Dashboard

[![Deploy](https://github.com/jeremyspofford/nova-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/jeremyspofford/nova-dashboard/actions/workflows/deploy.yml)

**Monitoring and control center for Aria Labs projects.**

A lightweight static dashboard showing project status, task board, usage metrics, and repo activity.

## Features

- 📊 **Project Overview** — Status of all Aria Labs apps
- ✅ **Live Task Board** — Real-time kanban powered by Supabase API
- 📈 **Usage Metrics** — Token usage, costs, and trends
- 🔄 **Auto-sync** — Tasks update immediately without commits/deploys

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Backend:** Cloudflare Pages Functions (API routes)
- **Database:** Supabase (PostgreSQL)
- **Charts:** Chart.js
- **Hosting:** Cloudflare Pages

## API

The dashboard includes a REST API for kanban task management. See [API.md](./API.md) for full documentation.

**Quick example:**
```bash
# Fetch all tasks
curl https://dashboard.arialabs.ai/api/kanban

# Create/update a task
curl -X POST https://dashboard.arialabs.ai/api/kanban \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "DATA-12",
    "title": "Refresh FEC finance data",
    "assignee": "Nova",
    "status": "in_progress",
    "priority": "high"
  }'
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Local development
npm run dev

# Deploy
npm run deploy
```

## Live

👉 [dashboard.arialabs.ai](https://dashboard.arialabs.ai)

---

Part of [Aria Labs](https://arialabs.ai)
