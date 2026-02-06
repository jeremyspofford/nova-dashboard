/**
 * Tests for Kanban API
 * Run with: npx vitest run functions/api/kanban.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Kanban API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('GET /api/kanban', () => {
    it('should return all tasks successfully', async () => {
      const mockTasks = [
        {
          id: '123',
          task_id: 'TEST-1',
          title: 'Test Task',
          description: 'Test description',
          assignee: 'Nova',
          status: 'in_progress',
          priority: 'high',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          metadata: {},
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'GET',
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTasks);
    });

    it('should handle Supabase errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Database error',
      });

      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'GET',
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Supabase error');
    });
  });

  describe('POST /api/kanban', () => {
    it('should create a task successfully', async () => {
      const newTask = {
        task_id: 'TEST-2',
        title: 'New Task',
        description: 'New description',
        assignee: 'Nova',
        status: 'backlog',
        priority: 'medium',
      };

      const createdTask = {
        id: '456',
        ...newTask,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [createdTask],
      });

      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'POST',
        body: JSON.stringify(newTask),
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdTask);
    });

    it('should validate required fields', async () => {
      const invalidTask = {
        title: 'Missing fields',
      };

      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'POST',
        body: JSON.stringify(invalidTask),
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should validate status values', async () => {
      const invalidTask = {
        task_id: 'TEST-3',
        title: 'Invalid Status',
        assignee: 'Nova',
        status: 'invalid_status',
        priority: 'high',
      };

      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'POST',
        body: JSON.stringify(invalidTask),
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid status');
    });

    it('should validate priority values', async () => {
      const invalidTask = {
        task_id: 'TEST-4',
        title: 'Invalid Priority',
        assignee: 'Nova',
        status: 'backlog',
        priority: 'invalid_priority',
      };

      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'POST',
        body: JSON.stringify(invalidTask),
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid priority');
    });
  });

  describe('OPTIONS /api/kanban', () => {
    it('should handle CORS preflight', async () => {
      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'OPTIONS',
      });

      const response = await onRequest({ request, env: mockEnv });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Unsupported methods', () => {
    it('should reject PUT requests', async () => {
      const { onRequest } = await import('./kanban');
      const request = new Request('http://localhost/api/kanban', {
        method: 'PUT',
      });

      const response = await onRequest({ request, env: mockEnv });
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });
  });
});
