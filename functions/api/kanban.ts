/**
 * Kanban API - Cloudflare Pages Function
 * Handles CRUD operations for kanban tasks stored in Supabase
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

interface KanbanTask {
  id?: string;
  task_id: string;
  title: string;
  description?: string;
  assignee: string;
  status: 'backlog' | 'in_progress' | 'done' | 'blocked';
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
    if (!['backlog', 'in_progress', 'done', 'blocked'].includes(body.status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid status. Must be: backlog, in_progress, done, or blocked' 
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

    // Upsert (insert or update)
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/kanban_tasks`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
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
