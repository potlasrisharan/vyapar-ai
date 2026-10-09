import { NextRequest, NextResponse } from 'next/server';
import { unifiedMultiModelChat, ChatMessage } from '@/lib/services/sarvam';
import { rigidRagDatabase } from '@/lib/services';
import { queryFinTraceZF, createSampleAuthenticatedLedger } from '@/lib/fintrace-zf';

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

function buildDynamicBusinessContext(context?: Record<string, unknown>): string {
  let prompt = BUSINESS_CONTEXT;
  const docs = (context?.uploadedDocuments || context?.uploadedInvoices || []) as Array<Record<string, unknown>>;
  const customInvoices = (context?.customInvoices || []) as Array<Record<string, unknown>>;

  if (docs.length > 0 || customInvoices.length > 0) {
    prompt += `\n\n--- USER-UPLOADED HISTORICAL INVOICES & DOCUMENTS ---\n`;
    prompt += `The business owner has uploaded the following ${docs.length} historical invoices/bills into the app:\n`;

    docs.forEach((doc, index: number) => {
      const ext = (doc.extractedData as Record<string, unknown>) || {};
      prompt += `${index + 1}. Document: "${doc.name || ext.invoiceNumber || 'Invoice'}"\n`;
      prompt += `   - Invoice Number: ${ext.invoiceNumber || doc.relatedId || 'N/A'}\n`;
      prompt += `   - Party / Customer / Vendor: ${ext.customer || ext.vendorName || 'N/A'}\n`;
      prompt += `   - Date: ${ext.date || ext.invoiceDate || 'N/A'}${ext.dueDate ? `, Due Date: ${ext.dueDate}` : ''}\n`;
      prompt += `   - Amount: ₹${ext.total || ext.totalAmount || 0} (Tax: ${ext.taxAmount || ((Number(ext.cgst) || 0) + (Number(ext.sgst) || 0))})\n`;
      prompt += `   - Status: ${ext.paymentStatus || doc.status || 'completed'}\n`;
      if (ext.items && Array.isArray(ext.items) && ext.items.length > 0) {
        prompt += `   - Items: ${(ext.items as Array<Record<string, unknown>>).map((it) => `${it.description || it.name} (${it.quantity || 1}x @ ₹${it.unitPrice || it.price || 0})`).join(', ')}\n`;
      }
    });

    prompt += `\nCRITICAL CONTEXT INSTRUCTION:
- You have complete awareness of all the user's uploaded invoices and old bills listed above.
- When the user asks "what old invoices did I upload?", "how much is in my uploaded bills?", or mentions any vendor/product from these files, provide exact amounts, numbers, and facts from these records.
- Advise the owner on cashflow, payment collection, and tax reconciliation taking into account both the store baseline and these newly uploaded invoices.`;
  }
  return prompt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const context = body.context;

    if (!messages.length) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Ingest client uploaded documents into rigid RAG database
    const docs = (context?.uploadedDocuments || context?.uploadedInvoices || []) as Array<Record<string, unknown>>;
    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        const ext = (doc.extractedData as Record<string, unknown>) || {};
        if (doc.type === 'profile' || ext.isBusinessProfile || ext.businessName || ext.ownerName) {
          rigidRagDatabase.ingestBusinessProfile({
            name: String(ext.businessName || ext.name || doc.name || 'Business'),
            owner: String(ext.ownerName || ext.owner || 'Ram Sharma'),
            city: String(ext.city || 'Kanpur'),
            state: String(ext.state || 'Uttar Pradesh'),
            gstin: ext.gstin ? String(ext.gstin) : undefined,
            pan: ext.pan ? String(ext.pan) : undefined,
            type: ext.type || ext.businessType ? String(ext.type || ext.businessType) : undefined,
            bankAccount: ext.bankAccount ? String(ext.bankAccount) : undefined,
            monthlyRevenue: Number(ext.monthlyRevenue || 0),
            monthlyExpenses: Number(ext.monthlyExpenses || 0),
            totalReceivables: Number(ext.totalReceivables || 0),
          });
        } else {
          rigidRagDatabase.ingestInvoice({
            id: String(ext.invoiceNumber || doc.relatedId || doc.name || 'INV-UP'),
            customer: ext.customer || ext.customerName || ext.vendorName ? String(ext.customer || ext.customerName || ext.vendorName) : undefined,
            vendor: ext.vendorName ? String(ext.vendorName) : undefined,
            date: String(ext.date || ext.invoiceDate || new Date().toISOString().slice(0, 10)),
            dueDate: ext.dueDate ? String(ext.dueDate) : undefined,
            total: Number(ext.total || ext.totalAmount || 0),
            subtotal: ext.subtotal ? Number(ext.subtotal) : undefined,
            tax: ext.taxAmount ? Number(ext.taxAmount) : undefined,
            status: String(ext.paymentStatus || doc.status || 'recorded'),
            gstin: ext.gstin ? String(ext.gstin) : undefined,
            items: Array.isArray(ext.items)
              ? (ext.items as Array<Record<string, unknown>>).map((it) => ({
                  description: String(it.description || it.name || 'Item'),
                  quantity: Number(it.quantity || 1),
                  unitPrice: Number(it.unitPrice || it.price || 0),
                  total: Number(it.total || 0),
                }))
              : [],
          });
        }
      });
    }

    // 2. FINTRACE-ZF Zero-Fabrication Mathematical Gate
    if (/upi|pos|reconcil|bank match|merkle|audit proof/i.test(lastMessage)) {
      const sampleLedger = createSampleAuthenticatedLedger();
      const zfResult = queryFinTraceZF(
        lastMessage,
        { id: "usr-sharma", role: "merchant", permissions: ["read:transactions", "read:reconcile"] },
        sampleLedger.records,
        sampleLedger.bankRecords
      );

      if (zfResult.status === "VERIFIED_RELEASE") {
        const isHindi = /कहा|क्या|कौन|बकाया|खर्च|बिजली|स्टॉक|नमस्ते|आज/i.test(lastMessage);
        const isHinglish = /aaj|kya|kaun|bakaaya|bakaya|kharch|bijli|stock|karein|karo|batao/i.test(lastMessage);
        const content = isHindi
          ? `[FINTRACE-ZF सत्यापित परिणाम] ✅\nकुल राशि: ${zfResult.value.formattedAmount} (${zfResult.value.recordCount} सत्यापित रिकॉर्ड)\nप्रमाण आईडी: ${zfResult.claimId}\nमर्कल रूट: ${zfResult.proof.merkleRoot.slice(0, 16)}...\nसत्यापित लेन-देन: ${zfResult.proof.sourceRecordIds.join(", ")}`
          : isHinglish
          ? `[FINTRACE-ZF Verified Result] ✅\nTotal Amount: ${zfResult.value.formattedAmount} (${zfResult.value.recordCount} verified records)\nClaim ID: ${zfResult.claimId}\nMerkle Root: ${zfResult.proof.merkleRoot.slice(0, 16)}...\nVerified Records: ${zfResult.proof.sourceRecordIds.join(", ")}`
          : `[FINTRACE-ZF Verified Result] ✅\nTotal Amount: ${zfResult.value.formattedAmount} across ${zfResult.value.recordCount} source-authenticated records.\nClaim ID: ${zfResult.claimId}\nMerkle Audit Root: ${zfResult.proof.merkleRoot.slice(0, 16)}...\nIncluded Transactions: ${zfResult.proof.sourceRecordIds.join(", ")}`;

        return NextResponse.json({
          role: 'assistant',
          content,
          provider: 'FINTRACE-ZF Zero-Fabrication Engine',
          evidenceIds: zfResult.proof.sourceRecordIds,
          claimId: zfResult.claimId,
          proof: zfResult.proof,
          isGrounded: true,
        });
      } else if (zfResult.status === "ABSTAIN") {
        return NextResponse.json({
          role: 'assistant',
          content: `[FINTRACE-ZF ⊥ Abstain] Zero-Fabrication Gate rejected claim release.\nReason: ${zfResult.reason}\nDiscrepancies: ${zfResult.discrepancies.join("; ")}`,
          provider: 'FINTRACE-ZF Zero-Fabrication Engine',
          evidenceIds: [],
          gateStatus: zfResult.gateStatus,
          isGrounded: false,
        });
      }
    }

    // 3. Check for Overdue Payments + Weekly Action Plan composite query
    const isHindi = /कहा|क्या|कौन|बकाया|खर्च|बिजली|स्टॉक|नमस्ते|आज/i.test(lastMessage);
    const isHinglish = /aaj|kya|kaun|bakaaya|bakaya|kharch|bijli|stock|karein|karo|batao/i.test(lastMessage);
    const lang = isHindi ? 'hi' : isHinglish ? 'hinglish' : 'en';

    const isOverdueAndWeeklyPlan =
      /(overdue|pending|unpaid|bakaaya|bakaya).*(week|hafta|do|karein|action)|what.*(do|action).*this week|which payments are overdue|payments.*overdue/i.test(lastMessage);

    if (isOverdueAndWeeklyPlan) {
      const plan = rigidRagDatabase.getOverdueAndWeeklyPlan(lang);

      if (process.env.SARVAM_CHAT_API_KEY || process.env.SARVAM_API_KEY || process.env.GROQ_API_KEY) {
        try {
          const promptWithPlan = `${buildDynamicBusinessContext(context)}\n\n=== VERIFIED OVERDUE BREAKDOWN & ACTION PLAN ===\n${plan.content}\n================================================\nCRITICAL: Answer with this exact breakdown, action plan, and explicitly name the relied-on documents.`;
          const aiRes = await unifiedMultiModelChat(messages, promptWithPlan);
          return NextResponse.json({
            role: 'assistant',
            content: aiRes.content,
            provider: `${aiRes.provider} (${aiRes.model})`,
            evidenceIds: plan.evidenceIds,
            reliedDocuments: plan.reliedDocuments,
            totalOverdue: plan.totalOverdue,
            isGrounded: true,
          });
        } catch (aiErr) {
          console.warn('AI Chat call failed for overdue plan, using deterministic plan:', aiErr);
        }
      }

      return NextResponse.json({
        role: 'assistant',
        content: plan.content,
        provider: 'VyaparAI Multi-Document Action Engine',
        evidenceIds: plan.evidenceIds,
        reliedDocuments: plan.reliedDocuments,
        totalOverdue: plan.totalOverdue,
        isGrounded: true,
      });
    }

    // 4. Rigid RAG Retrieval
    const retrieval = rigidRagDatabase.retrieve(lastMessage);

    let dynamicContext = buildDynamicBusinessContext(context);
    if (retrieval.isGrounded) {
      dynamicContext += `\n\n=== RETRIEVED VERIFIED EVIDENCE (STRICT GROUNDING) ===\n${retrieval.groundedContext}\n======================================================\nRIGID RAG CONSTRAINT: Answer the user's question ONLY and STRICTLY using the retrieved facts above. If the exact answer or specific numbers are not present in this evidence, state clearly: "This information is not present in the uploaded invoices or business records." Do not extrapolate or guess under any circumstances.`;
    } else if (/invoice|bill|upload|purana|purane|bussiness|business|gstin|receipt|amount|price|cost/i.test(lastMessage)) {
      dynamicContext += `\n\nSTRICT RAG GUARD: No verified records or uploaded invoices were found in the database matching this query. You MUST strictly reply: "This information is not present in the uploaded invoices or business records." Do not invent or estimate.`;
    }

    // 5. Attempt Multi-Model AI (Sarvam 105B -> Groq 120B -> Groq 27B)
    if (process.env.SARVAM_CHAT_API_KEY || process.env.SARVAM_API_KEY || process.env.GROQ_API_KEY) {
      try {
        const aiRes = await unifiedMultiModelChat(messages, dynamicContext);
        return NextResponse.json({
          role: 'assistant',
          content: aiRes.content,
          provider: `${aiRes.provider} (${aiRes.model})`,
          evidenceIds: retrieval.matchedChunks.map((c) => c.chunk.id),
          isGrounded: retrieval.isGrounded,
        });
      } catch (aiErr) {
        console.warn('Multi-model AI Chat call failed, falling back to deterministic rigid RAG engine:', aiErr);
      }
    }

    // 6. Deterministic Rigid Fallback
    if (retrieval.isGrounded && retrieval.matchedChunks.length > 0) {
      const topChunk = retrieval.matchedChunks[0].chunk;
      const content = isHindi
        ? `सत्यापित रिकॉर्ड के अनुसार:\n${topChunk.content}`
        : isHinglish
        ? `Verified record ke mutabik:\n${topChunk.content}`
        : `According to verified business records:\n${topChunk.content}`;

      return NextResponse.json({
        role: 'assistant',
        content,
        provider: 'VyaparAI Rigid RAG Engine',
        evidenceIds: retrieval.matchedChunks.map((c) => c.chunk.id),
        isGrounded: true,
      });
    }

    if (/upload|purana|purane|invoice|bill|gstin|bussiness|business/i.test(lastMessage)) {
      const refusal = isHindi
        ? `यह जानकारी अपलोड किए गए बिलों या व्यावसायिक रिकॉर्ड में उपलब्ध नहीं है।`
        : isHinglish
        ? `Yeh information upload kiye gaye invoices ya business records mein uplabdh nahi hai.`
        : `This information is not present in the uploaded invoices or business records.`;

      return NextResponse.json({
        role: 'assistant',
        content: refusal,
        provider: 'VyaparAI Rigid RAG Engine',
        evidenceIds: [],
        isGrounded: false,
      });
    }

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

