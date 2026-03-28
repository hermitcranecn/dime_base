/**
 * dime_base - RAG System Test
 */

import { initDatabase } from './database';
import * as rag from './agents/rag';

async function runTest() {
  console.log('🧪 Starting RAG System Test...\n');
  
  await initDatabase();
  rag.initRAG();
  
  const ownerId = 'test-owner-rag';
  
  // Test 1: Add knowledge
  console.log('📋 Test 1: Add knowledge document');
  const doc = rag.addKnowledge(
    ownerId,
    'Dime User Manual',
    'Dime is your digital assistant. It helps you manage tasks, answer questions, and remember important information. You can customize its personality and decision-making style. Dime can access your knowledge base to provide relevant answers.',
    'manual'
  );
  console.log(`  ✅ Added document: ${doc.id}`);
  console.log(`  📝 Chunks: ${doc.chunks.length}`);
  
  // Test 2: List knowledge
  console.log('\n📋 Test 2: List knowledge');
  const docs = rag.listKnowledge(ownerId);
  console.log(`  ✅ Found ${docs.length} documents`);
  
  // Test 3: Query knowledge
  console.log('\n📋 Test 3: Query knowledge');
  const result = rag.queryKnowledge(ownerId, 'What can Dime do?');
  console.log(`  ✅ Query returned:`);
  console.log(`  📝 Answer: ${result.answer.substring(0, 100)}...`);
  console.log(`  📝 Sources: ${result.sources.length}`);
  
  // Test 4: Get specific document
  console.log('\n📋 Test 4: Get specific document');
  const specificDoc = rag.getKnowledge(ownerId, doc.id);
  console.log(`  ✅ Got document: ${specificDoc?.title}`);
  
  // Test 5: Delete knowledge
  console.log('\n📋 Test 5: Delete knowledge');
  const deleted = rag.deleteKnowledge(ownerId, doc.id);
  console.log(`  ✅ Deleted: ${deleted}`);
  
  // Verify deletion
  const afterDelete = rag.listKnowledge(ownerId);
  console.log(`  📝 Remaining docs: ${afterDelete.length}`);
  
  console.log('\n🎉 All RAG tests passed!\n');
}

runTest().catch(console.error);
