#!/usr/bin/env node
/**
 * Migrate existing kanban.json data to Supabase
 * Run with: node migrate-kanban-data.js
 */

const fs = require('fs');
const path = require('path');

const KANBAN_JSON_PATH = path.join(__dirname, 'kanban.json');
const API_ENDPOINT = 'https://dashboard.arialabs.ai/api/kanban';

async function migrateData() {
  try {
    // Read existing kanban.json
    const data = JSON.parse(fs.readFileSync(KANBAN_JSON_PATH, 'utf8'));
    
    const tasks = [];
    
    // Transform inProgress tasks
    data.inProgress?.forEach((task, index) => {
      const taskMatch = task.task.match(/^([A-Z]+-\d+):/);
      const taskId = taskMatch ? taskMatch[1] : `ACTIVE-${index + 1}`;
      const title = task.task.replace(/^[A-Z]+-\d+:\s*/, '');
      
      tasks.push({
        task_id: taskId,
        title: title,
        description: task.notes || '',
        assignee: task.assignee || 'Nova',
        status: 'in_progress',
        priority: task.priority || 'medium',
        metadata: {
          url: task.url
        }
      });
    });
    
    // Transform upNext tasks
    data.upNext?.forEach((task, index) => {
      const taskMatch = task.task.match(/^([A-Z]+-\d+):/);
      const taskId = taskMatch ? taskMatch[1] : `BACKLOG-${index + 1}`;
      const title = task.task.replace(/^[A-Z]+-\d+:\s*/, '');
      
      tasks.push({
        task_id: taskId,
        title: title,
        description: task.notes || '',
        assignee: task.assignee || 'Nova',
        status: 'backlog',
        priority: task.priority || 'medium',
        metadata: {}
      });
    });
    
    // Transform blocked tasks
    data.blocked?.forEach((task, index) => {
      const taskMatch = task.task.match(/^([A-Z]+-\d+):/);
      const taskId = taskMatch ? taskMatch[1] : `BLOCKED-${index + 1}`;
      const title = task.task.replace(/^[A-Z]+-\d+:\s*/, '');
      
      tasks.push({
        task_id: taskId,
        title: title,
        description: task.blocker || '',
        assignee: task.assignee || 'Nova',
        status: 'blocked',
        priority: 'medium',
        metadata: {}
      });
    });
    
    // Transform doneToday tasks
    data.doneToday?.forEach((task, index) => {
      const taskMatch = task.task.match(/^([A-Z]+-\d+):/);
      const taskId = taskMatch ? taskMatch[1] : `DONE-${index + 1}`;
      const title = task.task.replace(/^[A-Z]+-\d+:\s*/, '');
      
      tasks.push({
        task_id: taskId,
        title: title,
        description: '',
        assignee: 'Nova',
        status: 'done',
        priority: 'medium',
        metadata: {
          outcome: task.outcome,
          time: task.time
        }
      });
    });
    
    console.log(`Migrating ${tasks.length} tasks to Supabase...`);
    
    // Send each task to the API
    let successCount = 0;
    let errorCount = 0;
    
    for (const task of tasks) {
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task)
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`✓ ${task.task_id}: ${task.title.substring(0, 50)}...`);
          successCount++;
        } else {
          console.error(`✗ ${task.task_id}: ${result.error}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`✗ ${task.task_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\nMigration complete:`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
