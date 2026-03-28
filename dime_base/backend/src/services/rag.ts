// RAG Service - Phase 1: Basic RAG with ChromaDB + Ollama
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'dime_rag_knowledge';

interface KnowledgeDoc {
  id: string;
  ownerId: string;
  content: string;
  metadata: {
    filename?: string;
    fileType?: string;
    createdAt: string;
    tags?: string[];
  };
}

class RAGService {
  private chroma: ChromaClient;
  private initialized = false;

  constructor() {
    this.chroma = new ChromaClient({ path: 'http://localhost:8000' });
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if collection exists, create if not
      const collections = await this.chroma.listCollections();
      const exists = collections.some(c => c.name === COLLECTION_NAME);
      
      if (!exists) {
        await this.chroma.createCollection({
          name: COLLECTION_NAME
        });
        console.log('✓ RAG Collection created');
      } else {
        console.log('✓ RAG Collection already exists');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('RAG init error:', error);
      throw error;
    }
  }

  // Generate embedding using Ollama
  private async getEmbedding(text: string): Promise<number[]> {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.status}`);
    }
    
    const data = await response.json() as { embedding: number[] };
    return data.embedding;
  }

  // Add document to knowledge base
  async addKnowledge(ownerId: string, content: string, metadata: {
    filename?: string;
    fileType?: string;
    tags?: string[];
  } = {}): Promise<KnowledgeDoc> {
    await this.init();
    
    const id = uuidv4();
    const doc: KnowledgeDoc = {
      id,
      ownerId,
      content,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      }
    };

    // Get embedding
    const embedding = await this.getEmbedding(content);

    // Add to ChromaDB
    const collection = await this.chroma.getCollection({ name: COLLECTION_NAME });
    await collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [content],
      metadatas: [{
        ownerId,
        filename: metadata.filename || '',
        fileType: metadata.fileType || '',
        createdAt: doc.metadata.createdAt,
        tags: (metadata.tags || []).join(',')
      }]
    });

    console.log(`✓ Knowledge added: ${id}`);
    return doc;
  }

  // List knowledge for owner
  async listKnowledge(ownerId: string, limit = 50): Promise<KnowledgeDoc[]> {
    await this.init();
    
    const collection = await this.chroma.getCollection({ name: COLLECTION_NAME });
    const results = await collection.get({
      where: { ownerId } as any,
      limit
    });

    return results.ids.map((id, i) => ({
      id,
      ownerId: String(results.metadatas?.[i]?.ownerId || ''),
      content: results.documents?.[i] || '',
      metadata: {
        filename: String(results.metadatas?.[i]?.filename || ''),
        fileType: String(results.metadatas?.[i]?.fileType || ''),
        createdAt: String(results.metadatas?.[i]?.createdAt || ''),
        tags: String(results.metadatas?.[i]?.tags || '').split(',').filter(Boolean)
      }
    }));
  }

  // Query knowledge base
  async queryKnowledge(ownerId: string, queryText: string, topK = 5): Promise<{
    results: Array<{ content: string; metadata: any; score: number }>;
  }> {
    await this.init();
    
    const queryEmbedding = await this.getEmbedding(queryText);
    
    const collection = await this.chroma.getCollection({ name: COLLECTION_NAME });
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: { ownerId } as any
    });

    const formatted = (results.documents?.[0] || []).map((doc, i) => ({
      content: doc || '',
      metadata: results.metadatas?.[i] || {},
      score: 1 - ((results.distances?.[0]?.[i]) || 0)
    }));

    return { results: formatted };
  }

  // Delete knowledge
  async deleteKnowledge(id: string): Promise<void> {
    await this.init();
    
    const collection = await this.chroma.getCollection({ name: COLLECTION_NAME });
    await collection.delete({ ids: [id] });
    console.log(`✓ Knowledge deleted: ${id}`);
  }
}

export const ragService = new RAGService();