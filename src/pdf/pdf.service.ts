// pdf.service.ts
import { Injectable } from '@nestjs/common';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';

@Injectable()
export class PdfService {
  private vectorStore: MemoryVectorStore;

  constructor() {}

  async processPdf(file: Express.Multer.File) {
    // 1. Read PDF
    const data = await pdf(file.buffer);
    const text = data?.text;

    // 2. Split text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text]);

    // 3. Create embeddings
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 4. Save to Qdrant
    this.vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
      url: 'http://localhost:6333',
      collectionName: 'pdf_collection',
    });
  }

  // Optional: query later
  async query(question: string): Promise<string[]> {
    if (!this.vectorStore) {
      throw new Error('No PDF embedded yet');
    }

    const retriever = this.vectorStore.asRetriever();
    const docs = await retriever.invoke(question);

    return docs.map((d) => d.pageContent);
  }
}