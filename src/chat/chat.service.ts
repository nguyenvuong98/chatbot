// chat.service.ts
import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { QdrantClientService } from 'src/db/qdrant/qdrant.service';
import { classifyQuestion } from 'src/constants/constants';

@Injectable()
export class ChatService {
  private COLLECTION = 'pdf_collection';

  constructor(
    private openaiService: OpenaiService,
    private qdrantService: QdrantClientService,
  ) { }

  async chatERP(question: string) {
    const prompt = `
    You are an assistant working as a staff member of a sales management dashboard.
    
    Your task is to understand user messages and classify them into intents, and extract structured parameters for reporting or information queries.
    
    INTENTS:
    1. question → when the user asks for general information about the shop (products, policies, operations, support, etc.)
    2. reportOrder → when the user requests analytics, summaries, statistics, or reports about orders or sales
    
    DATE & TIME RULES (IMPORTANT):
    All datetime must follow format: YYYY-MM-DD HH:mm:ss
    
    - If no date/time is mentioned:
      startDate = today 00:00:00
      endDate = today 23:59:59
    
    - If only a date is mentioned:
      startDate = 00:00:00 of that day
      endDate = 23:59:59 of that day
    
    - If a date range is mentioned:
      startDate = first date at 00:00:00
      endDate = last date at 23:59:59
    
    - If specific time is mentioned (e.g. 3pm):
      convert it to exact datetime
    
    ORDER STATUS FILTER (only for reportOrder):
    Allowed values:
    pending, processing, shipped, delivered, cancelled, refunded, all
    
    Rules:
    - If no status → "all"
    - If multiple statuses → return array
    - If intent = question → status = null
    
    OUTPUT FORMAT (STRICT JSON ONLY):
    {
      "intent": "reportOrder | question",
      "startDate": "YYYY-MM-DD HH:mm:ss",
      "endDate": "YYYY-MM-DD HH:mm:ss",
      "status": "pending | processing | shipped | delivered | cancelled | refunded | all | array | null"
    }
    
    EXAMPLES:
    
    User: "Show delivered orders last week"
    {
      "intent": "reportOrder",
      "startDate": "2026-04-14 00:00:00",
      "endDate": "2026-04-21 23:59:59",
      "status": "delivered"
    }
    
    User: "What is refund policy?"
    {
      "intent": "question",
      "startDate": "2026-04-21 00:00:00",
      "endDate": "2026-04-21 23:59:59",
      "status": null
    }
    `;
  }
  async chat(question: string): Promise<string> {
    // 1. Embed question
    const queryVector = await this.openaiService.embedQuery(question);

    // 2. Search Qdrant
    const results = await this.qdrantService.searchVector(
      this.COLLECTION,
      queryVector,
      '',
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

  async *chatStream(question: string): AsyncGenerator<string> {
    const topic = classifyQuestion(question);

    // 1. Embed question
    const queryVector = await this.openaiService.embedQuery(question);

    // 2. Search Qdrant
    const results = await this.qdrantService.searchVector(
      this.COLLECTION,
      queryVector,
      topic,
    );

    if (!results.length) {
      yield 'No relevant information found in documents.';
      return;
    }

    // 3. Build context
    const context = results
      .map((r: any) => r.payload?.content || '')
      .join('\n\n');

    // 4. Prompt
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

      Context:
      ${context}

      Question:
      ${question}

      Answer:
      `;

    // 5. STREAM OPENAI (IMPORTANT FIX)
    const stream = await this.openaiService.chatStream(prompt);

    for await (const chunk of stream) {
      // ✅ chunk is already string
      yield chunk;
    }
  }
}
