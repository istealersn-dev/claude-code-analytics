#!/usr/bin/env node

// Simple database connection test
// Run with: node test-db-connection.js

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'claude_code_analytics',
  user: process.env.USER || 'stanleynadar',
});

async function testConnection() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    
    console.log('✅ Connected to database successfully!');
    
    // Test the schema
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 Available tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test inserting a sample record
    console.log('🧪 Testing sample data insertion...');
    const testSession = await client.query(`
      INSERT INTO sessions (
        session_id, project_name, started_at, model_name, 
        total_input_tokens, total_output_tokens, total_cost_usd
      ) VALUES (
        'test-session-' || extract(epoch from now()), 
        'test-project', 
        NOW(), 
        'claude-3-5-sonnet-20241022',
        100, 
        50, 
        0.005
      ) RETURNING id, session_id;
    `);
    
    console.log('✅ Sample session created:', testSession.rows[0]);
    
    // Check if metrics were auto-generated
    const metrics = await client.query(`
      SELECT count(*) as metric_count 
      FROM session_metrics 
      WHERE session_id = $1;
    `, [testSession.rows[0].id]);
    
    console.log('📈 Auto-generated metrics:', metrics.rows[0].metric_count);
    
    // Clean up test data
    await client.query('DELETE FROM sessions WHERE session_id LIKE $1', ['test-session-%']);
    console.log('🧹 Test data cleaned up');
    
    console.log('🎉 Database is ready for Claude Code Analytics!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if pg module is available
try {
  require('pg');
} catch (error) {
  console.log('📦 Installing pg dependency...');
  console.log('Run: npm install pg');
  process.exit(1);
}

testConnection();
