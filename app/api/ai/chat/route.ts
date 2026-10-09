// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sarvamChat, ChatMessage } from '@/lib/services/sarvam';

const BUSINESS_CONTEXT = `You are VyaparAI, an intelligent AI Copilot for Indian MSMEs, specifically advising "Sharma Electronics", a consumer electronics retailer located in Kanpur, Uttar Pradesh.

Core Business Facts:
- Monthly Revenue: ₹4,82,000
- Total Receivables / Outstanding: ₹82,000 (Top debtors: Rahul Traders ₹48,000 overdue 14 days, Verma Electricals ₹24,000, Gupta Electronics ₹10,000)
- Monthly Expenses: ₹2,13,000
- Net Profit: ₹2,69,000
- Inventory Alerts: 12 SKUs critically low (e.g., Samsung 43" 4K Smart TV: 2 left, Havells Crabtree Modular Switches: 5 left, Anchor Roma 16A Sockets: 8 left)
- Priority Actions:
  1. Collect ₹48,000 from Rahul Traders (call/WhatsApp reminder)
  2. Reorder stock from Havells India & Samsung Electronics before Diwali rush
  3. Verify unusually high electricity bill (₹18,500 vs average ₹12,000)
  4. Follow up on 3 overdue customer invoices

Guidelines:
- Answer with high financial clarity, practical advice, and actionable next steps.
- You understand English, Hindi, and Hinglish naturally. If the user asks in Hindi/Hinglish, reply in Hindi/Hinglish.
- Keep tone professional, respectful, concise, and focused on saving money, boosting cash flow, and reducing risk.
- End each actionable advice with a concrete "Next Step" for the business owner.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];

    if (!messages.length) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const reply = await sarvamChat(messages, BUSINESS_CONTEXT);

    return NextResponse.json({
      role: 'assistant',
      content: reply,
      provider: 'Sarvam AI (sarvam-105b)',
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
