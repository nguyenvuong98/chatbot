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
  ) {}

  async chatERP(question: string) {
    const prompt = `
    You are an AI assistant working for a sales management dashboard.

Your job is to:
1. Classify user intent
2. Extract structured parameters for querying order reports

--------------------------------
INTENTS
--------------------------------
- "question": general information (products, policies, support, operations...)
- "reportOrder": analytics, reports, statistics about orders/sales

--------------------------------
CURRENT TIME
--------------------------------
Now: ${new Date().toISOString()}

All datetime must be formatted as:
YYYY-MM-DD HH:mm:ss

--------------------------------
DATE PARSING RULES
--------------------------------
- If no date mentioned:
  startDate = today 00:00:00
  endDate = today 23:59:59

- If only 1 date:
  startDate = that date 00:00:00
  endDate = that date 23:59:59

- If date range:
  startDate = first date 00:00:00
  endDate = last date 23:59:59

- If time mentioned (e.g. "3pm", "15:30"):
  convert to exact datetime

- Relative dates:
  "today", "yesterday", "last week", "this month", etc.
  MUST be converted to exact datetime ranges
If user refers to a day (today, yesterday, specific date), ALWAYS return full-day range (00:00:00 → 23:59:59)
--------------------------------
ORDER STATUS (ONLY for reportOrder)
--------------------------------
Allowed values (STRICT):
"", "To Deliver and Bill", "To Bill", "To Deliver"

Mapping rules:
- "delivered", "done", "completed" → "To Deliver"
- "pending payment", "unpaid" → "To Bill"
- "shipping", "in delivery" → "To Deliver"
- "processing both" → "To Deliver and Bill"

Rules:
- If no status mentioned → []
- If multiple → return array
- If intent = question → status = null
- NEVER return values outside allowed list

--------------------------------
OUTPUT FORMAT (STRICT)
--------------------------------
Return ONLY valid JSON. No explanation. No extra text.

{
  "intent": "reportOrder" | "question",
  "input": "string"
  "startDate": "YYYY-MM-DD HH:mm:ss",
  "endDate": "YYYY-MM-DD HH:mm:ss",
  "status": string[] | null
}

--------------------------------
IMPORTANT RULES
--------------------------------
- NEVER return text outside JSON
- ALWAYS include all fields
- If intent = question → status MUST be null
- If intent = reportOrder → status MUST be array
- status values MUST be from allowed list ONLY

--------------------------------
EXAMPLES
--------------------------------

User: "Show orders waiting for delivery"
{
  "intent": "reportOrder",
  "startDate": "2026-04-21 00:00:00",
  "endDate": "2026-04-21 23:59:59",
  "status": ["To Deliver"]
}

User: "Orders not paid yet"
{
  "intent": "reportOrder",
  "startDate": "2026-04-21 00:00:00",
  "endDate": "2026-04-21 23:59:59",
  "status": ["To Bill"]
}

User: "What is refund policy?"
{
  "intent": "question",
  "input": "What is refund policy?",
  "startDate": "2026-04-21 00:00:00",
  "endDate": "2026-04-21 23:59:59",
  "status": null
}

--------------------------------
USER INPUT
--------------------------------
${question}
    `;
    return this.openaiService.invokeStructure(prompt);
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
