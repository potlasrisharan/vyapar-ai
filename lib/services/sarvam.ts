// lib/services/sarvam.ts
// Official Sarvam AI Service Layer for VyaparAI (Indic LLM, Voice TTS/STT, Translation, Document Structuring)

const SARVAM_BASE_URL = 'https://api.sarvam.ai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InvoiceExtractionResult {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  taxAmount: number;
  gstin?: string;
  customerName?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  suggestedAction?: string;
}

function getApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    throw new Error('SARVAM_API_KEY is not defined in environment variables');
  }
  return key;
}

/**
 * Chat Completion using Sarvam 105B Conversations
 */
export async function sarvamChat(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const apiKey = getApiKey();

  const formattedMessages: ChatMessage[] = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  formattedMessages.push(...messages);

  const response = await fetch(`${SARVAM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      model: 'sarvam-105b-conversations',
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sarvam Chat API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    'Maaf kijiye, main abhi uttar nahi de pa raha hoon.'
  );
}

/**
 * Text-to-Speech using Sarvam Bulbul:v3
 * Returns base64 WAV audio string
 */
export async function sarvamTTS(
  text: string,
  targetLanguageCode: string = 'hi-IN',
  speaker: string = 'aditya'
): Promise<string> {
  const apiKey = getApiKey();

  // Truncate to 500 chars max per request for optimal speech synthesis
  const truncatedText = text.slice(0, 500).trim();

  const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      inputs: [truncatedText],
      target_language_code: targetLanguageCode,
      speaker: speaker,
      pitch: 0,
      pace: 1.0,
      loudness: 1.0,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: 'bulbul:v3',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sarvam TTS API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const base64Audio = data.audios?.[0];
  if (!base64Audio) {
    throw new Error('No audio returned from Sarvam TTS');
  }

  return base64Audio;
}

/**
 * Speech-to-Text using Sarvam Saaras:v2
 */
export async function sarvamSTT(
  audioBlob: Blob,
  fileName: string = 'audio.wav',
  languageCode: string = 'hi-IN'
): Promise<string> {
  const apiKey = getApiKey();

  const formData = new FormData();
  formData.append('file', audioBlob, fileName);
  formData.append('model', 'saaras:v2');
  if (languageCode && languageCode !== 'unknown') {
    formData.append('language_code', languageCode);
  }

  const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sarvam STT API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.transcript || '';
}

/**
 * Translate using Sarvam Translate API
 */
export async function sarvamTranslate(
  text: string,
  sourceLanguageCode: string = 'en-IN',
  targetLanguageCode: string = 'hi-IN'
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLanguageCode,
      target_language_code: targetLanguageCode,
      mode: 'formal',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sarvam Translate API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.translated_text || text;
}

/**
 * Parse and structure document content into an invoice using Sarvam 105B
 */
export async function sarvamExtractInvoice(
  rawDocumentText: string
): Promise<InvoiceExtractionResult> {
  const prompt = `You are a financial document parser for Indian MSMEs.
Extract structured invoice/bill information from the text below and output valid JSON ONLY with no markdown ticks or explanation.

JSON Schema:
{
  "vendorName": "string",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "totalAmount": number,
  "taxAmount": number,
  "gstin": "string",
  "customerName": "string",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "suggestedAction": "string"
}

Document text:
${rawDocumentText}`;

  const response = await sarvamChat([
    { role: 'user', content: prompt },
  ]);

  try {
    const cleanJson = response.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return {
      vendorName: 'Unknown Vendor',
      invoiceNumber: 'INV-MANUAL-01',
      invoiceDate: new Date().toISOString().slice(0, 10),
      totalAmount: 0,
      taxAmount: 0,
      items: [],
      suggestedAction: 'Review document manually',
    };
  }
}
