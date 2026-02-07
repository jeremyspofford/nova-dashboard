/**
 * Kanban API - Cloudflare Pages Function
 * Handles CRUD operations for kanban tasks stored in Supabase
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // For write operations (bypasses RLS)
}

interface KanbanTask {
  id?: string;
  task_id: string;
  title: string;
  description?: string;
  assignee: string;
  status: 'icebox' | 'backlog' | 'in_progress' | 'done' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle OPTIONS requests for CORS
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/kanban - Fetch all tasks
 */
async function handleGet(env: Env): Promise<Response> {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/kanban_tasks?order=created_at.desc`,
      {
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    const tasks = await response.json();

    return new Response(JSON.stringify({ success: true, data: tasks }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  }
}

/**
 * POST /api/kanban - Create or update a task
 */
async function handlePost(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as KanbanTask;

    // Validate required fields
    if (!body.task_id || !body.title || !body.assignee || !body.status || !body.priority) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: task_id, title, assignee, status, priority' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Validate status
    if (!['icebox', 'backlog', 'in_progress', 'done', 'blocked'].includes(body.status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid status. Must be: icebox, backlog, in_progress, done, or blocked' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Validate priority
    if (!['high', 'medium', 'low'].includes(body.priority)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid priority. Must be: high, medium, or low' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Use service role key for writes (bypasses RLS) or fall back to anon key
    const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    // Upsert (insert or update on task_id conflict)
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/kanban_tasks?on_conflict=task_id`,
      {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          task_id: body.task_id,
          title: body.title,
          description: body.description || '',
          assignee: body.assignee,
          status: body.status,
          priority: body.priority,
          metadata: body.metadata || {},
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    const task = await response.json();

    return new Response(
      JSON.stringify({ success: true, data: task[0] || task }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  }
}

/**
 * PUT /api/kanban - Update an existing task by task_id
 */
async function handlePut(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as Partial<KanbanTask> & { task_id: string };

    if (!body.task_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'task_id is required for updates' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Validate status if provided
    if (body.status && !['icebox', 'backlog', 'in_progress', 'done', 'blocked'].includes(body.status)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid status' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Validate priority if provided
    if (body.priority && !['high', 'medium', 'low'].includes(body.priority)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid priority' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    // Build update payload (only include provided fields)
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.title) updatePayload.title = body.title;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.assignee) updatePayload.assignee = body.assignee;
    if (body.status) updatePayload.status = body.status;
    if (body.priority) updatePayload.priority = body.priority;
    if (body.metadata) updatePayload.metadata = body.metadata;

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/kanban_tasks?task_id=eq.${encodeURIComponent(body.task_id)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    const tasks = await response.json();
    if (!tasks.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Task not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: tasks[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}

/**
 * DELETE /api/kanban - Delete a task by task_id (passed as query param)
 */
async function handleDelete(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('task_id');

    if (!taskId) {
      return new Response(
        JSON.stringify({ success: false, error: 'task_id query parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/kanban_tasks?task_id=eq.${encodeURIComponent(taskId)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    const deleted = await response.json();
    return new Response(
      JSON.stringify({ success: true, deleted: deleted.length }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}

/**
 * Main handler
 */
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // Route based on method
  switch (request.method) {
    case 'GET':
      return handleGet(env);
    case 'POST':
      return handlePost(request, env);
    case 'PUT':
      return handlePut(request, env);
    case 'DELETE':
      return handleDelete(request, env);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
  }
}
