import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface InterpretedQuery {
  domain?: 'gate' | 'invoice' | 'box' | 'packing' | 'stock' | 'customer' | 'notification' | 'overview';
  intent?: string;
  timePeriod?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'all_time';
  specificDate?: string;
  identifier?: string;
  customerName?: string;
  partNumber?: string;
  filterStatus?: string;
  isUrgentOrCritical?: boolean;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenAI | null = null;
  private modelName: string = 'gemini-flash-latest';

  constructor() {
    this.initClient();
  }

  /**
   * Initializes or re-initializes the Google GenAI client if GEMINI_API_KEY is present in env.
   */
  public initClient(): boolean {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    this.modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';

    if (apiKey && apiKey.length > 5) {
      try {
        this.client = new GoogleGenAI({ apiKey });
        this.logger.log(`Gemini AI service successfully initialized with model ${this.modelName}`);
        return true;
      } catch (err: any) {
        this.logger.warn(`Failed to initialize GoogleGenAI client: ${err?.message}`);
        this.client = null;
        return false;
      }
    } else {
      this.client = null;
      return false;
    }
  }

  /**
   * Returns true if a valid Gemini API key is configured and active.
   */
  public isAvailable(): boolean {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    return Boolean(this.client && apiKey && apiKey.length > 5);
  }

  /**
   * Returns the model name in use.
   */
  public getModelName(): string {
    return this.modelName;
  }

  /**
   * Generates content using the configured model, automatically falling back to alternative
   * valid Gemini Flash models if a specific model version is deprecated or throttled.
   */
  public async generateWithFallback(contents: any): Promise<string | null> {
    if (!this.isAvailable()) return null;

    const candidateModels = Array.from(
      new Set([this.modelName, 'gemini-3.8-flash', 'gemini-flash-latest'])
    );

    for (const model of candidateModels) {
      try {
        const response = await this.client!.models.generateContent({
          model,
          contents,
        });
        const text = response?.text?.trim();
        if (text) {
          if (this.modelName !== model) {
            this.modelName = model;
            this.logger.log(`Switched active Gemini model to ${model}`);
          }
          return text;
        }
      } catch (err: any) {
        this.logger.warn(`Gemini generation with ${model} failed: ${err?.message}`);
      }
    }
    return null;
  }

  /**
   * Validates the connection with Gemini API.
   */
  async testConnection(): Promise<{ success: boolean; model?: string; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'GEMINI_API_KEY is not configured or empty in backend/.env.',
      };
    }

    try {
      const text = await this.generateWithFallback('Ping test for ERP Barcode Assistant. Respond with "CONNECTED".');
      if (text) {
        return {
          success: true,
          model: this.modelName,
          message: text || 'Successfully connected to Gemini API.',
        };
      }
      return {
        success: false,
        model: this.modelName,
        message: 'No response text returned from Gemini API.',
      };
    } catch (err: any) {
      this.logger.warn(`Gemini test connection failed: ${err?.message}`);
      return {
        success: false,
        model: this.modelName,
        message: err?.message || 'Connection test failed',
      };
    }
  }

  /**
   * Interprets natural human questions (including informal phrasing, typos, or Hindi/English mix)
   * into structured query parameters for the ERP backend.
   */
  async interpretHumanQuery(query: string, userRole: string): Promise<InterpretedQuery | null> {
    if (!this.isAvailable()) return null;

    try {
      const prompt = `You are the natural language intent parser for an industrial manufacturing Barcode ERP system.
User role: "${userRole}".
Human question: "${query}".

Analyze the question and output a single strictly valid JSON object without markdown or backticks:
{
  "domain": "gate" | "invoice" | "box" | "packing" | "stock" | "customer" | "notification" | "overview",
  "intent": "COUNT" | "LIST" | "STATUS" | "DETAILS" | "COMPARE" | "SUMMARY" | "ANOMALY",
  "timePeriod": "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "all_time",
  "specificDate": "YYYY-MM-DD or null",
  "identifier": "invoice, box, or pass number if mentioned, else null",
  "customerName": "customer name if mentioned, else null",
  "partNumber": "part number or code if mentioned, else null",
  "filterStatus": "pending" | "waiting" | "verified" | "locked" | "unlocked" | "low_stock" | null,
  "isUrgentOrCritical": true | false
}`;

      const rawText = await this.generateWithFallback(prompt);
      if (!rawText) return null;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed as InterpretedQuery;
    } catch (err: any) {
      this.logger.warn(`Gemini query interpretation failed, falling back to rule engine: ${err?.message}`);
      return null;
    }
  }

  /**
   * Uses Gemini to synthesize a natural, executive-level answer grounded strictly in verified ERP data facts.
   * Adheres strictly to AGENTS.md:
   * - Factual evidence and real numbers
   * - No fabricated data or hallucinations
   * - Explainability standard
   */
  async synthesizeExecutiveAnswer(params: {
    userQuery: string;
    userRole: string;
    directFacts: string;
    dataSummary?: any;
    defaultAnswer?: string;
  }): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const prompt = `You are "Ask ERP AI Assistant", the intelligent manufacturing copilot for our factory ERP system.
Security & Policy Rules:
1. Ground your response strictly in the provided Verified Data Facts below. Never invent numbers, parts, or invoices.
2. Formulate a direct, natural, executive-ready explanation.
3. Be professional, clear, and actionable. Highlight exact numbers, counts, and operational status.
4. DO NOT use asterisks (*) or markdown bullet symbols like **bold**. Use plain clean text with clean bullet hyphens "- " and clear section titles.
5. Include Recommended Next Step for the human operator when applicable.
6. Currency & Units Standard: If any monetary figure, financial estimate, or price is ever mentioned, ALWAYS format it in Indian Rupees (₹ / INR). Never use US Dollars ($). Quantities labeled 'pcs' are physical piece/inventory counts, not currency amounts.

User Question: "${params.userQuery}"
User Role: "${params.userRole}"
Verified Data Facts from ERP Database:
${params.directFacts}
${params.dataSummary ? `Data Metrics: ${JSON.stringify(params.dataSummary)}` : ''}

Respond with the executive direct answer:`;

      const result = await this.generateWithFallback(prompt);
      return result || null;
    } catch (err: any) {
      this.logger.warn(`Gemini executive synthesis failed: ${err?.message}`);
      return null;
    }
  }

  /**
   * Generates a warm, intelligent conversational response for greetings, conversational questions,
   * or help inquiries, informing the user about what the ERP assistant can do for their role.
   */
  async generateConversationalResponse(params: {
    userQuery: string;
    userRole: string;
    plantContext?: string;
  }): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const prompt = `You are "Ask ERP AI Assistant", the intelligent conversational copilot for our factory ERP system (Talbros Barcode Management & ERP).
User role: "${params.userRole}".
User message: "${params.userQuery}".
${params.plantContext ? `Current Factory Context: ${params.plantContext}` : ''}

Instructions:
1. Greet the user naturally, warmly, and professionally.
2. Introduce yourself as the Ask ERP AI Assistant powered by Gemini.
3. Briefly mention 3 to 4 specific high-value things you can help them with based on their role (${params.userRole}):
   - Gate Passes & Dispatch clearance status
   - Invoices waiting for box packing or verification
   - Part master inventory and stock shortage alerts
   - Real-time factory operations overview
4. DO NOT use raw asterisks (*) or markdown bullet symbols like **bold**. Use clean plain text with clean bullet hyphens "- " and clear section titles.
5. Keep it concise (3-4 sentences or short bullet points).

Respond directly:`;

      const result = await this.generateWithFallback(prompt);
      return result || null;
    } catch (err: any) {
      this.logger.warn(`Gemini conversational response failed: ${err?.message}`);
      return null;
    }
  }
}

