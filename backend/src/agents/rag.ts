/**
 * dime_base - RAG Knowledge Base System
 * 
 * Phase 1: Basic RAG with ChromaDB + DeepSeek Embeddings
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';
import { ChromaClient, Collection } from 'chromadb';

// ============== CONFIG ==============
const CHUNK_SIZE = 500;
const TOP_K = 5;
const COLLECTION_NAME = 'dime_knowledge';

// ============== TYPES ==============
export interface KnowledgeDocument {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  category?: string;
  chunks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGQueryResult {
  answer: string;
  sources: {
    chunk: string;
    documentId: string;
    title: string;
    category?: string;
    similarity: number;
  }[];
}

// ============== CHROMADB ==============
let chromaClient: ChromaClient;
let knowledgeCollection: Collection;

async function getChromaCollection(): Promise<Collection> {
  if (knowledgeCollection) {
    return knowledgeCollection;
  }

  chromaClient = new ChromaClient();
  
  try {
    knowledgeCollection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'Dime knowledge base' }
    });
  } catch (error) {
    console.error('ChromaDB error:', error);
    throw error;
  }
  
  return knowledgeCollection;
}

// ============== EMBEDDINGS (TF-IDF based - local, no external API) ==============
const EMBEDDING_DIM = 128;

// Tokenize and normalize text
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

// Build TF-IDF vector
function textToVector(text: string, vocab: Map<string, number>, idf: Map<string, number>): number[] {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  const vec: number[] = new Array(EMBEDDING_DIM).fill(0);
  let idx = 0;

  for (const [word, count] of tf) {
    if (idx >= EMBEDDING_DIM) break;
    const termFreq = count / tokens.length;
    const invDocFreq = idf.get(word) || Math.log(2); // fallback
    vec[idx++] = termFreq * invDocFreq;
  }

  return vec;
}

// Global vocab and IDF (simplified)
const globalVocab = new Map<string, number>();
const globalIdf = new Map<string, number>();
const docCount = { count: 0 };

function updateVocab(text: string): void {
  const tokens = new Set(tokenize(text));
  for (const token of tokens) {
    globalVocab.set(token, globalVocab.get(token) || 0);
  }
}

function generateEmbedding(text: string): number[] {
  // Simple word-frequency based embedding for keyword matching
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const vec: number[] = new Array(EMBEDDING_DIM).fill(0);

  // Use hash to consistently map each token to a position
  for (const token of tokenSet) {
    let hash = 0;
    for (let j = 0; j < token.length; j++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(j);
      hash = hash & hash;
    }
    const idx = hash % EMBEDDING_DIM;
    vec[idx] += 1; // Count occurrences
  }

  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
}

// ============== TEXT CHUNKING ==============
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?\n]+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    if (currentChunk.length + trimmed.length < CHUNK_SIZE) {
      currentChunk += (currentChunk ? '. ' : '') + trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

// ============== DATABASE ==============
function createTables(): void {
  const db = getDb();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      chunks_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  saveDatabase();
}

function ensureTables(): void {
  const db = getDb();
  if (db) {
    try {
      db.exec("SELECT id FROM knowledge_documents WHERE id = 'init_check'");
    } catch (e) {
      createTables();
    }
  }
}

// ============== CORE API ==============

export async function initRAG(): Promise<void> {
  const db = getDb();
  if (db) {
    createTables();
  }
  
  // Initialize ChromaDB
  try {
    await getChromaCollection();
    console.log('ChromaDB RAG initialized');
  } catch (error) {
    console.error('Failed to initialize ChromaDB:', error);
  }
}

export function addKnowledge(
  ownerId: string,
  title: string,
  content: string,
  category?: string
): KnowledgeDocument {
  ensureTables();
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  // Chunk the content
  const chunks = chunkText(content);
  
  const doc: KnowledgeDocument = {
    id,
    ownerId,
    title,
    content,
    category,
    chunks,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
  
  // Save document metadata to SQLite
  db.run(
    `INSERT INTO knowledge_documents (id, owner_id, title, content, category, chunks_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ownerId, title, content, category || null, JSON.stringify(chunks), now, now]
  );
  
  saveDatabase();
  
  // Note: ChromaDB will be populated asynchronously when querying
  // For now, we store vectors in SQLite
  
  // Save chunks with their embeddings to SQLite for ChromaDB-like search
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${id}_chunk_${i}`;
    
    // Store chunk embedding in SQLite (for now, we'll compute on query)
    db.run(
      `INSERT INTO knowledge_chunks (id, document_id, owner_id, chunk_text, embedding_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        chunkId, 
        id, 
        ownerId, 
        chunks[i], 
        JSON.stringify({ pending: true }), // Placeholder
        JSON.stringify({ title, category, position: i })
      ]
    );
  }
  
  saveDatabase();
  return doc;
}

// Sync chunks to ChromaDB (call this periodically or on demand)
async function syncToChromaDB(ownerId: string, chunkId: string, chunkText: string, metadata: any): Promise<void> {
  try {
    const collection = await getChromaCollection();
    const embedding = await generateEmbedding(chunkText);
    
    await collection.add({
      ids: [chunkId],
      embeddings: [embedding],
      documents: [chunkText],
      metadatas: [{ ownerId, ...metadata }]
    });
  } catch (error) {
    console.error('Sync to ChromaDB error:', error);
  }
}

export function queryKnowledge(
  ownerId: string,
  question: string,
  topK: number = TOP_K
): RAGQueryResult {
  ensureTables();
  const db = getDb();

  // Generate query embedding
  const queryEmbedding = generateEmbedding(question);

  // Get all chunks for this owner
  const result = db.exec(
    `SELECT id, chunk_text, metadata_json
     FROM knowledge_chunks
     WHERE owner_id = ?`,
    [ownerId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return {
      answer: 'No knowledge found. Please add some documents first.',
      sources: []
    };
  }

  // Compute similarity in-memory
  const similarities: {
    chunkId: string;
    chunk: string;
    documentId: string;
    title: string;
    category?: string;
    similarity: number;
  }[] = [];

  for (const row of result[0].values) {
    const chunkId = row[0] as string;
    const chunkText = row[1] as string;
    const metadata = JSON.parse(row[2] as string);

    // Generate embedding for this chunk
    const chunkEmbedding = generateEmbedding(chunkText);

    const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

    // Extract document ID from chunk ID (format: docId_chunk_n)
    const docId = chunkId.split('_chunk_')[0];

    similarities.push({
      chunkId,
      chunk: chunkText,
      documentId: docId,
      title: metadata.title,
      category: metadata.category,
      similarity
    });
  }

  // Sort by similarity and take top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, topK);

  if (topResults.length === 0) {
    return {
      answer: 'No relevant knowledge found.',
      sources: []
    };
  }
  
  // Build answer from sources
  const answer = `Found ${topResults.length} relevant chunks:\n\n` +
    topResults.map(r => r.chunk).join('\n\n');
  
  return {
    answer,
    sources: topResults.map(r => ({
      chunk: r.chunk,
      documentId: r.documentId,
      title: r.title,
      category: r.category,
      similarity: r.similarity
    }))
  };
}

// Fallback when embeddings unavailable
function fallbackQuery(db: any, ownerId: string, question: string, topK: number): RAGQueryResult {
  const result = db.exec(
    `SELECT id, chunk_text, metadata_json 
     FROM knowledge_chunks 
     WHERE owner_id = ?`,
    [ownerId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return {
      answer: 'No knowledge found.',
      sources: []
    };
  }
  
  const keywords = question.toLowerCase().split(/\s+/);
  const scored: any[] = [];
  
  for (const row of result[0].values) {
    const chunkText = row[1] as string;
    const metadata = JSON.parse(row[2] as string);
    const docId = (row[0] as string).split('_chunk_')[0];
    
    // Simple keyword matching score
    let score = 0;
    const lowerChunk = chunkText.toLowerCase();
    for (const keyword of keywords) {
      if (lowerChunk.includes(keyword)) score++;
    }
    
    if (score > 0) {
      scored.push({
        chunk: chunkText,
        documentId: docId,
        title: metadata.title,
        category: metadata.category,
        similarity: score / keywords.length
      });
    }
  }
  
  scored.sort((a, b) => b.similarity - a.similarity);
  const topResults = scored.slice(0, topK);
  
  return {
    answer: topResults.length > 0 
      ? `Found ${topResults.length} relevant chunks:\n\n` + topResults.map(r => r.chunk).join('\n\n')
      : 'No relevant knowledge found.',
    sources: topResults
  };
}

export function listKnowledge(ownerId: string): KnowledgeDocument[] {
  ensureTables();
  const db = getDb();
  const result = db.exec(
    `SELECT id, owner_id, title, content, category, chunks_json, created_at, updated_at 
     FROM knowledge_documents 
     WHERE owner_id = ?
     ORDER BY created_at DESC`,
    [ownerId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }
  
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    ownerId: row[1],
    title: row[2],
    content: row[3],
    category: row[4],
    chunks: JSON.parse(row[5]),
    createdAt: new Date(row[6]),
    updatedAt: new Date(row[7])
  }));
}

export function getKnowledge(ownerId: string, documentId: string): KnowledgeDocument | null {
  ensureTables();
  const db = getDb();
  const result = db.exec(
    `SELECT id, owner_id, title, content, category, chunks_json, created_at, updated_at 
     FROM knowledge_documents 
     WHERE id = ? AND owner_id = ?`,
    [documentId, ownerId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const row = result[0].values[0];
  return {
    id: row[0] as string,
    ownerId: row[1] as string,
    title: row[2] as string,
    content: row[3] as string,
    category: row[4] as string | undefined,
    chunks: JSON.parse(row[5] as string),
    createdAt: new Date(row[6] as string),
    updatedAt: new Date(row[7] as string)
  };
}

export function deleteKnowledge(ownerId: string, documentId: string): boolean {
  ensureTables();
  const db = getDb();
  
  // Verify ownership
  const docResult = db.exec(
    `SELECT id FROM knowledge_documents WHERE id = ? AND owner_id = ?`,
    [documentId, ownerId]
  );
  
  if (docResult.length === 0 || docResult[0].values.length === 0) {
    return false;
  }
  
  // Delete chunks first
  db.run(`DELETE FROM knowledge_chunks WHERE document_id = ?`, [documentId]);
  
  // Delete document
  db.run(`DELETE FROM knowledge_documents WHERE id = ? AND owner_id = ?`, [documentId, ownerId]);
  
  saveDatabase();
  return true;
}
