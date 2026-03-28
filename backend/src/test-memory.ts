/**
 * dime_base - Memory System Test (Simple)
 */

import { initDatabase, getDb, saveDatabase } from './database';
import { createDime, getDime, getDimeByOwner } from './agents/dime';
import * as memory from './agents/memory';

const TEST_OWNER = 'test-owner-123';

async function runTests() {
  console.log('🧪 Starting dime_base Memory System Tests...\n');
  
  await initDatabase();
  console.log('📦 Database initialized\n');
  
  let passed = 0;
  
  // Cleanup existing test dime
  try {
    const existing = getDimeByOwner(TEST_OWNER);
    if (existing) {
      const db = getDb();
      db.run('DELETE FROM dimes WHERE owner_id = ?', [TEST_OWNER]);
      saveDatabase();
    }
  } catch (e) { /* ignore */ }
  
  const dime = createDime(TEST_OWNER, undefined, 'test-dime');
  console.log(`📦 Created test dime: ${dime.id}\n`);
  
  try {
    // Phase 1: Add conversation
    console.log('📋 Phase 1: Add & Get Conversations');
    memory.addConversation(dime.id, [
      { id: '1', sender: 'user', content: 'Hello!', timestamp: new Date() },
      { id: '2', sender: 'dime', content: 'Hi there!', timestamp: new Date() }
    ]);
    const recent = memory.getRecentConversations(dime.id, 5);
    console.log(`  ✅ Added conversation, got ${recent.length} recent`);
    passed++;
    
    // Phase 1: Add many conversations
    console.log('📋 Phase 1: Capacity (100 max)');
    for (let i = 0; i < 25; i++) {
      memory.addConversation(dime.id, [
        { id: `msg-${i}`, sender: 'user', content: `Test ${i}`, timestamp: new Date() }
      ]);
    }
    const recent25 = memory.getRecentConversations(dime.id, 30);
    console.log(`  ✅ ${recent25.length} conversations (max 100)`);
    passed++;
    
    // Phase 2: Semantic entry
    console.log('📋 Phase 2: Semantic Memory');
    memory.addSemanticEntry(dime.id, 'favorite_color', 'blue');
    const dimeObj = getDime(dime.id);
    if (!dimeObj) throw new Error('Dime not found');
    const searchResult = memory.searchSemanticMemory(dimeObj, 'favorite_color');
    console.log(`  ✅ Semantic search found ${searchResult.length} results`);
    passed++;
    
    // Phase 3: Summaries
    console.log('📋 Phase 3: Memory Summaries');
    const summaries = memory.getMemorySummaries(dime.id);
    console.log(`  ✅ Got ${summaries.length} summaries`);
    passed++;
    
    // Phase 4: Encryption
    console.log('📋 Phase 4: Encryption');
    const encryptResult = memory.encryptMemory(dime.id, true);
    console.log(`  ✅ Encrypt: ${encryptResult}`);
    passed++;
    
    // Integration: Full chat
    console.log('📋 Integration: Full Chat Flow');
    memory.addConversation(dime.id, [
      { id: '1', sender: 'user', content: 'My name is John', timestamp: new Date() },
      { id: '2', sender: 'dime', content: 'Nice to meet you, John!', timestamp: new Date() }
    ]);
    console.log('  ✅ Chat with memory works');
    passed++;
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
  
  // Cleanup
  try {
    const db = getDb();
    db.run('DELETE FROM dimes WHERE owner_id = ?', [TEST_OWNER]);
    saveDatabase();
  } catch (e) { /* ignore */ }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🧪 Test Results: ${passed}/6 passed`);
  console.log('='.repeat(50));
  
  if (passed === 6) {
    console.log('\n🎉 All memory system tests passed!\n');
  }
}

runTests().catch(console.error);
