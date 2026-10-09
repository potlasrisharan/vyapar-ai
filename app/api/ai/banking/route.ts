import { NextRequest, NextResponse } from "next/server";
import {
  generateVerifiedBankingResponse,
  matchCurrentAccounts,
  matchCreditCards,
  VERIFIED_CURRENT_ACCOUNTS,
  VERIFIED_CREDIT_CARDS,
  VERIFIED_UPI_GUIDES,
  LAST_VERIFIED_DATE,
} from "@/lib/domain/banking-agent";
import { unifiedMultiModelChat, ChatMessage } from "@/lib/services/sarvam";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const BANKING_SYSTEM_PROMPT = `You are VyaparAI's Banking & Financial Setup Agent advising Indian MSMEs, shop owners, and retailers (specifically "Sharma Electronics", a consumer electronics retailer in Kanpur, Uttar Pradesh).

CRITICAL COMPLIANCE AND TRUTH RULES:
1. Use real, current, verifiable financial data ONLY. Never fabricate or invent a banking product, fee, MAB requirement, cash deposit slab, reward point, interest rate, eligibility threshold, or URL.
2. Available verified current accounts:
   - State Bank of India (SBI) Regular Current Account: MAB ₹10,000 (Metro/Urban), ₹5,000 (Rural/Semi-urban). Free cash deposit up to ₹25,000/day or ₹5 Lakhs/month. Branch-based opening. URL: https://sbi.co.in/web/business/sme/current-accounts/regular-current-account
   - HDFC Bank SmartUp Alpha / BIZ Max: MAB ₹10,000 to ₹25,000. Free cash deposit up to 10-12x AMB (max ₹25L/month). Online assisted opening. URL: https://www.hdfcbank.com/sme/business-banking/current-accounts
   - ICICI Bank Business Advantage / Classic: MAB ₹25,000. InstaBIZ portal with ERP/Tally auto-reconciliation. Video-KYC instant digital opening. URL: https://www.icicibank.com/business-banking/current-account
3. Available verified business credit cards:
   - HDFC Business MoneyBack: Annual fee ₹500 + GST (waived at ₹50,000 spend/year). 4 RP per ₹150 on online business spends, 5X on utilities & taxes. ITR min ₹3.0L p.a. URL: https://www.hdfcbank.com/personal/pay/cards/credit-cards/business-moneyback
   - ICICI Coral Business: Annual fee ₹1,000 + GST (waived at ₹1.5L spend/year). 2 pts per ₹100 domestic, 1 domestic airport lounge per quarter on spend criteria. ITR min ₹4.8L p.a. URL: https://www.icicibank.com/business-banking/cards/business-credit-card
   - Axis Business Supreme: Annual fee ₹1,500 + GST (waived at ₹3L spend/year). Accelerated rewards on digital ads, vendor bills, software. Min ITR ₹6L or ₹25L turnover. URL: https://www.axisbank.com/retail/cards/credit-card/business-supreme-credit-card
4. UPI Onboarding (NPCI Certified):
   - Standard Bank-to-Bank UPI: 0% MDR for merchants and customers.
   - P2P Personal Limit: strict ₹1,00,000/24 hours and 20 transactions/day.
   - P2M Merchant Limit: up to ₹5,00,000/day settlement with soundbox voice alerts.
   - Official URL: https://www.npci.org.in/what-we-do/upi/product-overview
5. PRIVACY & SECURITY: NEVER request, accept, or process OTPs, UPI PINs, NetBanking passwords, or CVVs. Warn the user that legitimate banks never ask for UPI PINs to receive money.
6. Speak naturally in English, Hindi, or Hinglish matching the user's language. Keep recommendations practical and concise for shop owners. Always include the official URL link.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const lang: Language = (body.language as Language) || "en";
    const lastUserMessage = messages.filter((m) => m.role === "user").at(-1)?.content || "";

    if (!lastUserMessage.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    // 1. Generate deterministic verified ground truth
    const verifiedData = generateVerifiedBankingResponse(lastUserMessage, lang);

    // 2. Synthesize with Sarvam 105B Indic LLM (with Groq backup)
    let aiContent = "";
    try {
      const augmentedPrompt = `${BANKING_SYSTEM_PROMPT}\n\nGround Truth Reference:\n${verifiedData.reply}\n\nLanguage to use: ${lang}`;
      aiContent = (await unifiedMultiModelChat(messages, augmentedPrompt)).content ?? "";
    } catch (llmErr) {
      console.warn("Unified LLM call failed, falling back to verified deterministic engine:", llmErr);
      aiContent = verifiedData.reply;
    }

    return NextResponse.json({
      content: aiContent || verifiedData.reply,
      category: verifiedData.category,
      sources: verifiedData.sources,
      suggestedFollowups: verifiedData.suggestedFollowups,
      lastVerifiedDate: LAST_VERIFIED_DATE,
      verifiedProducts: {
        currentAccounts: VERIFIED_CURRENT_ACCOUNTS.map((c) => ({
          id: c.id,
          name: `${c.bankName} - ${c.accountName}`,
          mab: c.mabRequirement,
          cashLimit: c.cashDepositLimit,
          url: c.verification.sourceUrl,
        })),
        creditCards: VERIFIED_CREDIT_CARDS.map((c) => ({
          id: c.id,
          name: `${c.bankName} - ${c.cardName}`,
          fee: `₹${c.annualFee} (Waived at ${c.feeWaiverCondition})`,
          rewards: c.rewardRate,
          url: c.verification.sourceUrl,
        })),
      },
    });
  } catch (error) {
    console.error("Banking agent API error:", error);
    return NextResponse.json(
      { error: "Failed to process banking setup query" },
      { status: 500 }
    );
  }
}
