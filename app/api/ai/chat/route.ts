// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sarvamChat, ChatMessage } from '@/lib/services/sarvam';

const BUSINESS_CONTEXT = `You are VyaparAI, an intelligent AI Copilot for Indian MSMEs, specifically advising "Sharma Electronics", a consumer electronics retailer located in Kanpur, Uttar Pradesh.

Core Business Facts:
- Monthly Revenue: ₹4,82,000 (across 40 billed invoices)
- Payments Received: ₹4,00,000
- Total Receivables / Outstanding: ₹82,000 (Top debtors: Rahul Traders / ABC Traders with ₹48,000 and ₹35,000, Verma Electricals ₹24,000)
- Overdue Invoices: 3 overdue invoices (INV-1023 due 23 Sept is 12 days overdue; INV-1042 is 14 days overdue)
- Monthly Expenses: ₹2,13,000 (vs August ₹2,02,378, +5.2%)
- Anomaly: Electricity bill EXP-6 is ₹24,500 vs August ₹19,758 (+24% spike due to commercial surcharge)
- Inventory Alerts: 5 SKUs critically low (Dell 24-inch Monitor: 8 left, boAt Stone 350 Speaker: 0 left, Logitech Keyboard: 4 left)
- Priority Actions:
  1. Collect ₹35,000 - ₹48,000 from top debtor (send WhatsApp / Email payment reminder)
  2. Reorder stock from Techline Distributors for Dell Monitors and boAt speakers
  3. Verify unusually high electricity bill (₹24,500 vs August ₹19,758)

Guidelines:
- Answer with high financial clarity, practical advice, and actionable next steps.
- You understand English, Hindi, and Hinglish naturally. If the user asks in Hindi/Hinglish, reply in Hindi/Hinglish.
- Keep tone professional, respectful, concise, and focused on saving money, boosting cash flow, and reducing risk.
- End each actionable advice with a concrete "Next Step" for the business owner.`;

/**
 * Deterministic multi-turn fallback engine when external AI provider is offline
 */
function generateContextualFallback(messages: ChatMessage[]): { content: string; evidenceIds: string[]; actionId?: string } {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
  const conversationText = messages.map((m) => m.content.toLowerCase()).join(" ");

  const isHindi = /कहा|क्या|कौन|बकाया|खर्च|बिजली|स्टॉक|नमस्ते|आज/i.test(lastMessage);
  const isHinglish = /aaj|kya|kaun|bakaaya|bakaya|kharch|bijli|stock|karein|karo|batao/i.test(lastMessage);

  // Check for multi-turn follow-ups
  const mentionsOldestInvoice = /oldest|purana|invoice|bill #|1042|1023/i.test(lastMessage);
  const refersToPreviousDebtor = mentionsOldestInvoice || /their|unka|uska|wahi/i.test(lastMessage);

  if (refersToPreviousDebtor && (conversationText.includes("rahul") || conversationText.includes("abc") || conversationText.includes("owe"))) {
    if (isHindi) {
      return {
        content: `उनका सबसे पुराना बकाया बिल INV-1023 (₹35,000) है, जो 23 सितंबर को देय था और अब 12 दिन से अधिक समय से बकाया है। इसके अतिरिक्त बिल INV-1042 (₹13,000) भी लंबित है। कुल बकाया ₹48,000 है।\n\nअगला कदम: ग्राहक को तुरंत WhatsApp या फोन पर रिमाइंडर भेजें।`,
        evidenceIds: ["EVD-INV-1023"],
        actionId: "INS-1",
      };
    }
    if (isHinglish) {
      return {
        content: `Unka sabse purana pending bill INV-1023 (₹35,000) hai, jo 23 September ko due tha aur ab 12 din se overdue hai. Saath hi INV-1042 (₹13,000) bhi pending hai. Total outstanding ₹48,000 hai.\n\nNext Step: Customer ko turant WhatsApp ya call par reminder bheinjein.`,
        evidenceIds: ["EVD-INV-1023"],
        actionId: "INS-1",
      };
    }
    return {
      content: `Their oldest unpaid invoice is INV-1023 (₹35,000), which was due on 23 September and is 12 days overdue. Coupled with INV-1042 (₹13,000), their total outstanding balance is ₹48,000.\n\nNext Step: Send an instant payment reminder via WhatsApp or phone.`,
      evidenceIds: ["EVD-INV-1023"],
      actionId: "INS-1",
    };
  }

  // Who owes me the most?
  if (/who owes|kaun|bakaya|bakaaya|debtor|receivable/i.test(lastMessage)) {
    if (isHindi) {
      return {
        content: `ABC Traders और Rahul Traders पर सबसे अधिक बकाया है। INV-1023 पर ₹35,000 बकाया 12 दिनों से लंबित है, जो आपके कुल ₹82,000 बकाया का 42.7% है।\n\nअगला कदम: फॉलो-अप शुरू करें और भुगतान की तारीख पक्की करें।`,
        evidenceIds: ["EVD-INV-1023"],
        actionId: "INS-1",
      };
    }
    if (isHinglish) {
      return {
        content: `ABC Traders aur Rahul Traders par sabse zyada bakaaya hai. INV-1023 par ₹35,000 pichhle 12 din se overdue hai, jo aapke total ₹82,000 outstanding ka 42.7% hai.\n\nNext Step: Follow-up initiate karein aur payment date confirm karein.`,
        evidenceIds: ["EVD-INV-1023"],
        actionId: "INS-1",
      };
    }
    return {
      content: `ABC Traders owes ₹35,000 on INV-1023 (12 days overdue), making up 42.7% of your total ₹82,000 outstanding receivables.\n\nNext Step: Follow up with Amit Sharma (+91 9870100173) to lock in a settlement date.`,
      evidenceIds: ["EVD-INV-1023"],
      actionId: "INS-1",
    };
  }

  // Why did expenses increase?
  if (/expense|kharch|bijli|electricity|increase|badha/i.test(lastMessage)) {
    if (isHindi) {
      return {
        content: `सितंबर का कुल खर्च ₹2,13,000 रहा, जो अगस्त (₹2,02,378) से 5.2% अधिक है। सबसे बड़ी वृद्धि बिजली के बिल में हुई (₹24,500 vs ₹19,758, +24%), जिसमें UPPCL पीक लोड सरचार्ज शामिल है।\n\nअगला कदम: बिल की मीटर रीडिंग और लोड खपत की जांच करें।`,
        evidenceIds: ["EVD-ELECTRICITY"],
        actionId: "INS-3",
      };
    }
    if (isHinglish) {
      return {
        content: `September total expenses ₹2,13,000 rahe, jo August (₹2,02,378) se 5.2% zyada hain. Sabse bada jump electricity bill mein aaya (₹24,500 vs ₹19,758, +24%), jisme UPPCL peak load charge shamil hai.\n\nNext Step: Bill ki meter reading aur sanctioned load check karein.`,
        evidenceIds: ["EVD-ELECTRICITY"],
        actionId: "INS-3",
      };
    }
    return {
      content: `September expenses totaled ₹2,13,000 (+5.2% vs August). The key anomaly is the electricity bill: ₹24,500 vs ₹19,758 in August (+24% / +₹4,742) due to commercial peak load surcharges.\n\nNext Step: Cross-examine the meter reading against sanctioned commercial load before paying.`,
      evidenceIds: ["EVD-ELECTRICITY"],
      actionId: "INS-3",
    };
  }

  // Low stock / inventory
  if (/stock|inventory|product|kam|khatam/i.test(lastMessage)) {
    if (isHindi) {
      return {
        content: `5 उत्पाद अपने पुनः ऑर्डर स्तर पर या नीचे हैं:\n1. boAt Stone 350 Speaker — 0 यूनिट (स्टॉक समाप्त)\n2. Logitech K120 Keyboard — 4 यूनिट\n3. Dell 24-inch Monitor — 8 यूनिट (लगभग 5 दिनों का स्टॉक)\n\nअगला कदम: Techline Distributors को 20 मॉनिटर और 20 स्पीकर्स का खरीद आदेश दें।`,
        evidenceIds: ["EVD-STOCK", "EVD-OUTOFSTOCK"],
        actionId: "INS-2",
      };
    }
    if (isHinglish) {
      return {
        content: `5 products reorder level par ya usse neeche hain:\n1. boAt Stone 350 Speaker — 0 units (Out of stock)\n2. Logitech K120 Keyboard — 4 units\n3. Dell 24-inch Monitor — 8 units (lagbhag 5 din ka stock)\n\nNext Step: Techline Distributors ko 20 monitors aur speakers ka restock order bhejein.`,
        evidenceIds: ["EVD-STOCK", "EVD-OUTOFSTOCK"],
        actionId: "INS-2",
      };
    }
    return {
      content: `5 products need restocking:\n1. boAt Stone 350 Speaker — 0 units (Out of stock)\n2. Logitech K120 Keyboard — 4 units remaining\n3. Dell 24-inch Monitor — 8 units (covers ~5 days at 1.6 units/day)\n\nNext Step: Issue a purchase order for 20 Dell monitors to Techline Distributors.`,
      evidenceIds: ["EVD-STOCK", "EVD-OUTOFSTOCK"],
      actionId: "INS-2",
    };
  }

  // Non-business or unknown query (e.g. "Tell me a joke") -> guide to suggested questions
  if (isHindi) {
    return {
      content: `मैं आज की प्राथमिकताओं, बकाया भुगतानों, खर्च, कम स्टॉक या मासिक सारांश में मदद कर सकता हूँ। नमूना डेटा देखने के लिए सुझाये गए सवाल (suggested question) चुनें।`,
      evidenceIds: [],
    };
  }
  if (isHinglish) {
    return {
      content: `Main aaj ki priorities, bakaaya payments, kharch, kam stock ya monthly summary mein madad kar sakta hoon. Sample data ke liye suggested question choose karein.`,
      evidenceIds: [],
    };
  }
  return {
    content: `I can help with today's priorities, outstanding payments, expenses, low stock or your monthly business summary. Choose a suggested question to explore the sample data.`,
    evidenceIds: [],
  };
}

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

    // Attempt Sarvam AI Indic LLM first
    if (process.env.SARVAM_API_KEY) {
      try {
        const reply = await sarvamChat(messages, BUSINESS_CONTEXT);
        return NextResponse.json({
          role: 'assistant',
          content: reply,
          provider: 'Sarvam AI (sarvam-105b)',
          evidenceIds: ['EVD-INV-1023', 'EVD-STOCK'],
        });
      } catch (sarvamErr) {
        console.warn('Sarvam API call failed, using deterministic MSME reasoning engine:', sarvamErr);
      }
    }

    // Contextual deterministic engine fallback
    const fallback = generateContextualFallback(messages);

    return NextResponse.json({
      role: 'assistant',
      content: fallback.content,
      provider: 'VyaparAI Deterministic Reasoning Engine',
      evidenceIds: fallback.evidenceIds,
      actionId: fallback.actionId,
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

