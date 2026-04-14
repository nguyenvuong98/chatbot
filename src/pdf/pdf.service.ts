// pdf.service.ts
import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pdfParse from 'pdf-parse';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { VectorStore } from '@langchain/core/vectorstores';

@Injectable()
export class PdfService {
  private vectorStore!: VectorStore;

  async processPdf(file: Express.Multer.File) {
    // 1. Read PDF
    //const parser = new PDFParse(file.buffer);
    //const data = await parser.getText();
    const data = await pdfParse(file.buffer);
    const text = data?.text;

    if (!text) {
      throw new Error('PDF content is empty');
    }

    // 2. Split text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments(
      [text],
      [
        {
          fileName: file.originalname,
        },
      ],
    );

    // 3. Embeddings (FIXED MODEL)
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small', // 1536 dims
    });

    // 4. Use existing collection instead of recreating
    this.vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URI,
        collectionName: 'pdf_collection',
      },
    );

    // 5. Add documents
    await this.vectorStore.addDocuments(docs);
  }

  async query(question: string): Promise<string[]> {
    if (!this.vectorStore) {
      throw new Error('No PDF embedded yet');
    }

    const retriever = this.vectorStore.asRetriever({
      k: 3, // top results
    });

    const docs = await retriever.invoke(question);

    return docs.map((d) => d.pageContent);
  }
}
