/**
 * dime_base - RAG Knowledge Base System
 * 
 * Phase 1: Basic RAG
 * - Document upload/parsing
 * - Vector storage (SQLite + Simulated Embedding)
 * - RAG retrieval API
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';
import crypto from 'crypto';

// ============== CONFIG ==============
const CHUNK_SIZE = 500;  // Characters per chunk
const CHUNK_OVERLAP = 50;
const TOP_K = 5;
const EMBEDDING_DIM = 64;

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

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  ownerId: string;
  chunkText: string;
  embedding: number[];
  metadata: {
    title: string;
    category?: string;
    position: number;
  };
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

// ============== EMBEDDING ==============
function generateEmbedding(text: string): number[] {
  const hash = crypto.createHash('sha256').update(text).digest();
  const embedding: number[] = [];
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    embedding.push((hash[i % hash.length] - 128) / 128);
  }
  return embedding;
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
  
  // Knowledge documents table
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
  
  // Knowledge chunks table (for vector search)
  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding_json TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES knowledge_documents(id)
    )
  `);
  
  // Create index for faster search
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_chunks_owner ON knowledge_chunks(owner_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_docs_owner ON knowledge_documents(owner_id)');
  } catch (e) {
    // Index might already exist
  }
  
  saveDatabase();
}

// ============== CORE API ==============

/**
 * Initialize RAG system (lazy - only if db is ready)
 */
export function initRAG(): void {
  const db = getDb();
  if (db) {
    createTables();
  }
}

/**
 * Ensure RAG tables exist (lazy initialization)
 */
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

/**
 * Add knowledge document
 */
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
  
  // Save document
  db.run(
    `INSERT INTO knowledge_documents (id, owner_id, title, content, category, chunks_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ownerId, title, content, category || null, JSON.stringify(chunks), now, now]
  );
  
  // Save chunks with embeddings
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = uuidv4();
    const embedding = generateEmbedding(chunks[i]);
    
    db.run(
      `INSERT INTO knowledge_chunks (id, document_id, owner_id, chunk_text, embedding_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        chunkId, 
        id, 
        ownerId, 
        chunks[i], 
        JSON.stringify(embedding),
        JSON.stringify({ title, category, position: i })
      ]
    );
  }
  
  saveDatabase();
  return doc;
}

/**
 * Query knowledge base
 */
export function queryKnowledge(
  ownerId: string,
  question: string,
  topK: number = TOP_K
): RAGQueryResult {
  ensureTables();
  const db = getDb();
  
  // Generate query embedding
  const queryEmbedding = generateEmbedding(question);
  
  // Search chunks
  const result = db.exec(
    `SELECT chunk_text, embedding_json, metadata_json 
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
  
  // Calculate similarities
  const similarities: {
    chunk: string;
    documentId: string;
    title: string;
    category?: string;
    similarity: number;
  }[] = [];
  
  for (const row of result[0].values) {
    const chunkText = row[0] as string;
    const embedding = JSON.parse(row[1] as string);
    const metadata = JSON.parse(row[2] as string);
    
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    
    similarities.push({
      chunk: chunkText,
      documentId: row[1] as string, // This is wrong, need to fix
      title: metadata.title,
      category: metadata.category,
      similarity
    });
  }
  
  // Sort by similarity and take top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, topK);
  
  // Build answer from top chunks
  const context = topResults.map(r => r.chunk).join('\n\n');
  
  return {
    answer: `Found ${topResults.length} relevant chunks:\n\n${context}`,
    sources: topResults.map(r => ({
      chunk: r.chunk,
      documentId: r.documentId,
      title: r.title,
      category: r.category,
      similarity: r.similarity
    }))
  };
}

/**
 * List knowledge documents
 */
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

/**
 * Delete knowledge document
 */
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
  db.run('DELETE FROM knowledge_chunks WHERE document_id = ?', [documentId]);
  
  // Delete document
  db.run('DELETE FROM knowledge_documents WHERE id = ?', [documentId]);
  
  saveDatabase();
  return true;
}

/**
 * Get document by ID
 */
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
    category: row[4] as string,
    chunks: JSON.parse(row[5] as string),
    createdAt: new Date(row[6] as string),
    updatedAt: new Date(row[7] as string)
  };
}

export default {
  initRAG,
  addKnowledge,
  queryKnowledge,
  listKnowledge,
  deleteKnowledge,
  getKnowledge
};
