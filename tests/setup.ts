import { beforeAll, afterAll, beforeEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test database setup
const TEST_DB_NAME = 'claude_code_analytics_test';
const TEST_DB_URL = `postgresql://localhost:5432/${TEST_DB_NAME}`;

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.PORT = '3002'; // Use different port for tests
  
  try {
    // Create test database if it doesn't exist
    await execAsync(`createdb ${TEST_DB_NAME} 2>/dev/null || true`);
    
    // Run schema migrations
    await execAsync(`psql ${TEST_DB_URL} -f schema-claude-code-2.sql`);
    
    console.log('Test database setup complete');
  } catch (error) {
    console.warn('Test database setup failed:', error);
  }
});

afterAll(async () => {
  try {
    // Clean up test database
    await execAsync(`dropdb ${TEST_DB_NAME} 2>/dev/null || true`);
    console.log('Test database cleanup complete');
  } catch (error) {
    console.warn('Test database cleanup failed:', error);
  }
});

beforeEach(async () => {
  // Clear test data before each test
  try {
    await execAsync(`psql ${TEST_DB_URL} -c "TRUNCATE TABLE raw_messages, session_metrics, sessions, sync_metadata, checkpoints, background_tasks, subagents, vscode_integrations CASCADE;"`);
  } catch (error) {
    console.warn('Test data cleanup failed:', error);
  }
});
