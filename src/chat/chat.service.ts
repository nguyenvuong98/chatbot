// chat.service.ts
import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { QdrantClientService } from 'src/db/qdrant/qdrant.service';

@Injectable()
export class ChatService {
  private COLLECTION = 'pdf_collection';

  constructor(
    private openaiService: OpenaiService,
    private qdrantService: QdrantClientService,
  ) {}

  async chat(question: string): Promise<string> {
    // 1. Embed question
    const queryVector = await this.openaiService.embedQuery(question);

    // 2. Search Qdrant
    const results = await this.qdrantService.searchVector(
      this.COLLECTION,
      queryVector,
    );

    if (!results.length) {
      return 'No relevant information found in documents.';
    }

    // 3. Build context
    const context = results
      .map((r: any) => r.payload?.content || '')
      .join('\n\n');

    // 4. STRICT prompt (important)
    const prompt = `
You are a job candidate answering interview questions about your own CV.

Identity:
- You are the person described in the CV.
- Always speak in FIRST PERSON ("tôi" in Vietnamese, "I" in English).
- NEVER refer to yourself by name.

Core Rules:
- Answer naturally like a real candidate in an interview.
- Be confident, clear, and professional.
- Keep answers concise but informative.
- Use bullet points when helpful.

Context Usage:
- Use the provided context as the primary source of truth.
- If some details are clearly part of your CV but missing from the retrieved context, you may still answer based on your overall profile.
- Do NOT hallucinate or invent new experiences.

Ambiguous / Follow-up Questions:
- If the user's question is ambiguous or incomplete (e.g., "more details", "chi tiết", "nói rõ hơn"),
  infer the full intent based on the previous conversation.
- Expand the answer accordingly.

Language:
- Detect the language of the question.
- Respond strictly in the same language.
- Do NOT mix languages.

Fallback:
- If you truly do not have the information, respond naturally:
  - Vietnamese: "Hiện tại tôi chưa có kinh nghiệm về phần này."
  - English: "I don't have experience with this yet."

Context (CV):
${context}

Question:
${question}

Answer:
`;

    // 5. Ask LLM
    return this.openaiService.chat(prompt);
  }
}
