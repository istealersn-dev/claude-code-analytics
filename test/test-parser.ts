import { JSONLParser } from '../src/parsers/jsonl-parser.js';
import { DataValidator } from '../src/utils/validation.js';
import * as path from 'path';
import { DatabaseMessage, SessionMetrics } from '../src/types/index.js';

async function testParser() {
  console.log('🧪 Testing JSONL Parser...\n');
  
  const parser = new JSONLParser();
  const sampleFilePath = path.join(process.cwd(), 'test', 'sample-session.jsonl');
  
  try {
    const result = await parser.parseSessionFile(sampleFilePath);
    
    if (result.success) {
      console.log('✅ Parser Test: SUCCESS\n');
      
      console.log('📊 Session Data:');
      console.log(`  - Session ID: ${result.data?.session.session_id}`);
      console.log(`  - Project: ${result.data?.session.project_name || 'N/A'}`);
      console.log(`  - Started: ${result.data?.session.started_at}`);
      console.log(`  - Ended: ${result.data?.session.ended_at}`);
      console.log(`  - Duration: ${result.data?.session.duration_seconds}s`);
      console.log(`  - Model: ${result.data?.session.model_name}`);
      console.log(`  - Input Tokens: ${result.data?.session.total_input_tokens}`);
      console.log(`  - Output Tokens: ${result.data?.session.total_output_tokens}`);
      console.log(`  - Total Cost: $${result.data?.session.total_cost_usd?.toFixed(6)}`);
      console.log(`  - Tools Used: [${result.data?.session.tools_used.join(', ')}]`);
      console.log(`  - Cache Hits: ${result.data?.session.cache_hit_count}`);
      console.log(`  - Cache Misses: ${result.data?.session.cache_miss_count}\n`);
      
      console.log('💬 Messages:');
      result.data?.messages.forEach((msg: DatabaseMessage, idx: number) => {
        console.log(`  ${idx + 1}. [${msg.role}] ${msg.input_tokens + msg.output_tokens} tokens`);
        if (msg.tool_name) {
          console.log(`     Tool: ${msg.tool_name}`);
        }
      });
      
      console.log('\n📈 Metrics:');
      const metrics: SessionMetrics | undefined = result.data?.metrics;
      if (metrics) {
        console.log(`  - Date: ${metrics.date_bucket.toDateString()}`);
        console.log(`  - Hour: ${metrics.hour_bucket}:00`);
        console.log(`  - Weekday: ${metrics.weekday} (0=Sunday)`);
        console.log(`  - Week of Year: ${metrics.week_of_year}`);
        console.log(`  - Message Count: ${metrics.message_count}`);
        console.log(`  - Tool Usage Count: ${metrics.tool_usage_count}`);
        console.log(`  - Cache Efficiency: ${(metrics.cache_efficiency * 100).toFixed(1)}%`);
      }
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach((warning: string) => console.log(`  - ${warning}`));
      }
      
    } else {
      console.log('❌ Parser Test: FAILED\n');
      console.log('Errors:');
      result.errors.forEach((error: any) => {
        console.log(`  - [${error.error_type}] ${error.message}`);
        if (error.line_number) {
          console.log(`    Line: ${error.line_number}`);
        }
      });
    }
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
  }
  
  console.log('\n🔍 Testing Validation...');
  
  const validationErrors = DataValidator.validateFileStructure(
    sampleFilePath,
    '{"role": "user", "content": "test"}\n{"invalid": json}\n{"role": "assistant", "content": "response"}'
  );
  
  console.log(`Validation found ${validationErrors.length} errors:`);
  validationErrors.forEach((error: any) => {
    console.log(`  - [${error.error_type}] Line ${error.line_number}: ${error.message}`);
  });
  
  console.log('\n✨ Test completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testParser().catch(console.error);
}

export { testParser };