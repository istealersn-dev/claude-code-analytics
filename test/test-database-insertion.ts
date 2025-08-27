import { DatabaseConnection } from '../src/database/connection.js';
import { DatabaseInserter } from '../src/database/inserter.js';
import { DataSyncService } from '../src/services/data-sync.js';
import { JSONLParser } from '../src/parsers/jsonl-parser.js';
import * as path from 'path';

async function testDatabaseInsertion() {
  console.log('🧪 Testing Database Insertion Pipeline...\n');

  try {
    // Initialize database connection
    console.log('1️⃣ Initializing database connection...');
    const db = DatabaseConnection.getInstance(DatabaseConnection.getDefaultConfig());
    
    // Test connection
    const connectionTest = await db.testConnection();
    if (!connectionTest) {
      console.error('❌ Database connection failed');
      return;
    }

    // Initialize schema
    console.log('2️⃣ Initializing database schema...');
    await db.initializeSchema();

    // Parse sample data
    console.log('3️⃣ Parsing sample session data...');
    const parser = new JSONLParser();
    const sampleFilePath = path.join(process.cwd(), 'test', 'sample-session.jsonl');
    const parseResult = await parser.parseSessionFile(sampleFilePath);

    if (!parseResult.success || !parseResult.data) {
      console.error('❌ Failed to parse sample data');
      return;
    }

    console.log('✅ Sample data parsed successfully');
    console.log(`   - Session: ${parseResult.data.session.session_id}`);
    console.log(`   - Messages: ${parseResult.data.messages.length}`);
    console.log(`   - Tokens: ${parseResult.data.session.total_input_tokens + parseResult.data.session.total_output_tokens}`);

    // Test single session insertion
    console.log('\n4️⃣ Testing single session insertion...');
    const inserter = new DatabaseInserter(db);
    const insertResult = await inserter.insertSessionData(parseResult.data);

    console.log('📊 Insertion Result:');
    console.log(`   - Success: ${insertResult.success}`);
    console.log(`   - Sessions inserted: ${insertResult.inserted.sessions}`);
    console.log(`   - Messages inserted: ${insertResult.inserted.messages}`);
    console.log(`   - Metrics inserted: ${insertResult.inserted.metrics}`);
    console.log(`   - Duplicates skipped: ${insertResult.duplicatesSkipped}`);
    console.log(`   - Errors: ${insertResult.errors.length}`);

    if (insertResult.errors.length > 0) {
      console.log('⚠️ Insertion errors:');
      insertResult.errors.forEach(error => {
        console.log(`   - [${error.type}] ${error.error}`);
      });
    }

    // Test duplicate detection
    console.log('\n5️⃣ Testing duplicate detection...');
    const duplicateResult = await inserter.insertSessionData(parseResult.data);
    console.log(`   - Duplicates skipped: ${duplicateResult.duplicatesSkipped}`);
    console.log(`   - New insertions: ${duplicateResult.inserted.sessions}`);

    // Test data sync service
    console.log('\n6️⃣ Testing data sync service...');
    const syncService = new DataSyncService(db);
    
    // Dry run first
    console.log('   🧪 Running dry run sync...');
    const dryRunResult = await syncService.syncSpecificFiles([sampleFilePath], { 
      dryRun: true 
    });
    
    console.log(`   - Would process: ${dryRunResult.summary.sessionsInserted} sessions`);
    console.log(`   - Would insert: ${dryRunResult.summary.messagesInserted} messages`);
    console.log(`   - Processing time: ${dryRunResult.timing.durationMs}ms`);

    // Get database stats
    console.log('\n7️⃣ Getting database statistics...');
    const stats = await inserter.getSessionStats();
    console.log('📈 Database Statistics:');
    console.log(`   - Total sessions: ${stats.totalSessions}`);
    console.log(`   - Total messages: ${stats.totalMessages}`);
    console.log(`   - Total cost: $${stats.totalCost.toFixed(6)}`);
    console.log(`   - Date range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);

    // Test health check
    console.log('\n8️⃣ Testing health check...');
    const healthCheck = await syncService.healthCheck();
    console.log('🏥 Health Check Result:');
    console.log(`   - Status: ${healthCheck.status}`);
    console.log(`   - Connected: ${healthCheck.details.connected}`);
    console.log(`   - Latency: ${healthCheck.details.latency}ms`);
    console.log(`   - Pool stats:`, healthCheck.details.poolStats);

    // Test data validation
    console.log('\n9️⃣ Testing data integrity...');
    const validationQuery = `
      SELECT 
        s.session_id,
        s.total_input_tokens,
        s.total_output_tokens,
        COUNT(m.id) as message_count,
        SUM(m.input_tokens) as sum_input_tokens,
        SUM(m.output_tokens) as sum_output_tokens
      FROM sessions s
      LEFT JOIN raw_messages m ON s.id = m.session_id
      GROUP BY s.id, s.session_id, s.total_input_tokens, s.total_output_tokens
    `;

    const validationResult = await db.query(validationQuery);
    console.log('🔍 Data Integrity Check:');
    
    for (const row of validationResult.rows) {
      const tokenMatch = row.total_input_tokens === parseInt(row.sum_input_tokens) &&
                         row.total_output_tokens === parseInt(row.sum_output_tokens);
      
      console.log(`   - Session ${row.session_id}:`);
      console.log(`     Messages: ${row.message_count}`);
      console.log(`     Token integrity: ${tokenMatch ? '✅' : '❌'}`);
      
      if (!tokenMatch) {
        console.log(`     Expected: ${row.total_input_tokens}/${row.total_output_tokens}`);
        console.log(`     Actual: ${row.sum_input_tokens}/${row.sum_output_tokens}`);
      }
    }

    console.log('\n✅ Database insertion pipeline test completed successfully!');
    
    // Close connection
    await db.close();

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error(error instanceof Error ? error.stack : 'Unknown error');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseInsertion().catch(console.error);
}

export { testDatabaseInsertion };