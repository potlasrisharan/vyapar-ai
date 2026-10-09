import type { AssistantService, Language, PromptId } from "@/lib/types";
import { sleep } from "@/lib/utils/format";
import { translate } from "@/lib/i18n";
export const promptKeys = {today:"promptToday",owes:"promptOwes",expenses:"promptExpenses",stock:"promptStock",summary:"promptSummary"} as const;
const responses = {
 today:{en:"Based on your September records, I recommend three priorities:\n\n1. Follow up with ABC Traders for ₹35,000 — invoice INV-1023 is 12 days overdue.\n2. Reorder Dell 24-inch Monitor — 8 units remain, about 5 days at the demo velocity of 1.6 units/day. Consider 20 units.\n3. Review electricity costs — ₹24,500, up 24% from August. Compare meter readings and tariffs before deciding why.",hi:"सितंबर के रिकॉर्ड के आधार पर तीन प्राथमिकताएं हैं:\n\n1. ABC Traders से ₹35,000 के लिए संपर्क करें — INV-1023 12 दिन से बकाया है।\n2. Dell 24-inch Monitor का स्टॉक भरें — 8 यूनिट बाकी हैं, डेमो बिक्री दर 1.6 यूनिट/दिन पर लगभग 5 दिन। 20 यूनिट पर विचार करें।\n3. बिजली खर्च की समीक्षा करें — ₹24,500, अगस्त से 24% अधिक। कारण तय करने से पहले मीटर रीडिंग और दरों की तुलना करें।",hinglish:"September records ke hisaab se teen priorities hain:\n\n1. ABC Traders se ₹35,000 ke liye follow-up karein — INV-1023 12 din overdue hai.\n2. Dell 24-inch Monitor restock karein — 8 units bache hain, demo velocity 1.6 units/day par lagbhag 5 din. 20 units consider karein.\n3. Bijli expense review karein — ₹24,500, August se 24% zyada. Wajah decide karne se pehle meter readings aur tariffs compare karein."},
 owes:{en:"ABC Traders owes ₹35,000 on INV-1023, your largest unpaid invoice. It was due on 23 September and is 12 days overdue as of 5 October. No payment is recorded.\n\nThis is 42.7% of your total ₹82,000 outstanding. Create a follow-up and agree on a payment date.",hi:"ABC Traders पर INV-1023 के ₹35,000 बकाया हैं — आपका सबसे बड़ा अवैतनिक बिल। यह 23 सितंबर को देय था और 5 अक्टूबर को 12 दिन से बकाया है। कोई भुगतान दर्ज नहीं है।\n\nयह कुल ₹82,000 बकाया का 42.7% है। फॉलो-अप बनाकर भुगतान की तारीख तय करें।",hinglish:"ABC Traders par INV-1023 ke ₹35,000 bakaaya hain — aapka sabse bada unpaid invoice. Due date 23 September thi, 5 October ko 12 din overdue. Koi payment recorded nahi hai.\n\nYeh total ₹82,000 outstanding ka 42.7% hai. Follow-up banakar payment date confirm karein."},
 expenses:{en:"September expenses are ₹2,13,000, versus ₹2,02,378 in August — up 5.2%.\n\nElectricity is the clearest anomaly: ₹24,500 versus ₹19,758, up 24% (₹4,742). Inventory purchases also rose by ₹6,000; other category changes offset part of the increase.\n\nThe bill confirms the amount, not the cause. Check usage and tariffs before taking action.",hi:"सितंबर खर्च ₹2,13,000 रहा, अगस्त के ₹2,02,378 से 5.2% अधिक।\n\nबिजली सबसे स्पष्ट बदलाव है: ₹19,758 से ₹24,500, यानी 24% (₹4,742) अधिक। स्टॉक खरीद भी ₹6,000 बढ़ी; अन्य श्रेणियों के बदलाव ने कुछ वृद्धि संतुलित की।\n\nबिल राशि की पुष्टि करता है, कारण की नहीं। कार्रवाई से पहले खपत और दर जांचें।",hinglish:"September kharch ₹2,13,000 tha, August ke ₹2,02,378 se 5.2% zyada.\n\nBijli sabse bada anomaly hai: ₹19,758 se ₹24,500, yani 24% (₹4,742) zyada. Stock purchases ₹6,000 badhe; doosri categories ne kuch increase offset kiya.\n\nBill amount confirm karta hai, wajah nahi. Action se pehle usage aur tariff check karein."},
 stock:{en:"Five products are at or below their reorder level:\n\n• Dell 24-inch Monitor — 8 units, about 5 days of cover.\n• Logitech K120 Keyboard — 4 units, critical.\n• boAt Stone 350 Speaker — 0 units, out of stock.\n• Samsung 43-inch Smart TV — 12 units.\n• TP-Link Archer C6 Router — 6 units.\n\nPrioritize the speaker and monitor. Confirm supplier availability before ordering.",hi:"पांच उत्पाद पुनः ऑर्डर स्तर पर या उससे नीचे हैं:\n\n• Dell 24-inch Monitor — 8 यूनिट, लगभग 5 दिनों का स्टॉक।\n• Logitech K120 Keyboard — 4 यूनिट, अत्यंत कम।\n• boAt Stone 350 Speaker — 0 यूनिट, स्टॉक समाप्त।\n• Samsung 43-inch Smart TV — 12 यूनिट।\n• TP-Link Archer C6 Router — 6 यूनिट।\n\nस्पीकर और मॉनिटर को प्राथमिकता दें। ऑर्डर से पहले आपूर्तिकर्ता से उपलब्धता पूछें।",hinglish:"Paanch products reorder level par ya usse neeche hain:\n\n• Dell 24-inch Monitor — 8 units, lagbhag 5 din ka stock.\n• Logitech K120 Keyboard — 4 units, critical.\n• boAt Stone 350 Speaker — 0 units, stock khatam.\n• Samsung 43-inch Smart TV — 12 units.\n• TP-Link Archer C6 Router — 6 units.\n\nSpeaker aur monitor ko priority dein. Order se pehle supplier availability confirm karein."},
 summary:{en:"September at a glance:\n\n• Revenue billed: ₹4,82,000 across 40 invoices.\n• Payments received: ₹4,00,000.\n• Outstanding: ₹82,000, including 3 overdue invoices.\n• Expenses: ₹2,13,000.\n• Revenue less expenses: ₹2,69,000 — this is not accounting profit.\n• 30 products, with 5 needing stock attention.\n\nYour next move: collect the ABC Traders balance, then review restocking and electricity costs.",hi:"सितंबर एक नज़र में:\n\n• बिल की गई बिक्री: 40 बिलों से ₹4,82,000।\n• प्राप्त भुगतान: ₹4,00,000।\n• बकाया: ₹82,000, जिनमें 3 समय से बकाया बिल हैं।\n• खर्च: ₹2,13,000।\n• बिक्री में से खर्च: ₹2,69,000 — यह लेखांकन लाभ नहीं है।\n• 30 उत्पाद, 5 के स्टॉक पर ध्यान ज़रूरी।\n\nअगला कदम: ABC Traders का भुगतान लें, फिर स्टॉक और बिजली खर्च देखें।",hinglish:"September ek nazar mein:\n\n• Billed revenue: 40 invoices se ₹4,82,000.\n• Payment received: ₹4,00,000.\n• Bakaaya: ₹82,000, jinmein 3 overdue invoices hain.\n• Kharch: ₹2,13,000.\n• Revenue minus expenses: ₹2,69,000 — yeh accounting profit nahi hai.\n• 30 products, 5 ke stock par dhyan zaroori.\n\nAgla kadam: ABC Traders ka payment lein, phir restocking aur bijli ka kharch dekhein."}
};
export function classifyQuestion(q:string):PromptId{if(/today|aaj|आज|priority|priorities|week|hafta|हफ्ता/i.test(q))return "today";if(/owe|owes|बकाया|bakaaya|bakaya|payment|receivable|overdue/i.test(q))return "owes";if(/expense|खर्च|kharch|bijli|electricity/i.test(q))return "expenses";if(/stock|inventory|product|स्टॉक|उत्पाद/i.test(q))return "stock";if(/summary|summar|month|सारांश|महीने|mahine/i.test(q))return "summary";return "unknown";}
export function responseText(id:PromptId,lang:Language){return id==="unknown"?translate(lang,"unsupported"):responses[id][lang];}
const sources:Record<PromptId,string[]>={today:["EVD-INV-1023","EVD-STOCK","EVD-ELECTRICITY"],owes:["EVD-INV-1023"],expenses:["EVD-ELECTRICITY"],stock:["EVD-STOCK","EVD-OUTOFSTOCK"],summary:["EVD-INV-1023","EVD-STOCK","EVD-ELECTRICITY"],unknown:[]};
export const assistantService: AssistantService = {
  async ask(question, language, promptId, context) {
    const id = promptId ?? classifyQuestion(question);
    const hasUploadedDocs = Array.isArray(context?.uploadedDocuments) && context.uploadedDocuments.length > 0;

    // Fast-path only for standard prompt chip clicks when no uploaded documents exist
    if (promptId && promptId !== "unknown" && !hasUploadedDocs) {
      await sleep(150);
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        text: responseText(id, language),
        promptId: id,
        evidenceIds: sources[id],
        createdAt: new Date().toISOString(),
      };
    }

    // Call /api/ai/chat with question and dynamic context (Sarvam 105B)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          context: context || {},
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          return {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.content,
            promptId: id,
            evidenceIds: data.evidenceIds || sources[id] || [],
            createdAt: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn("AI chat API fetch failed or timed out, falling back to local reasoning:", err);
    }

    await sleep(200);
    const fallbackText = id === "unknown" && hasUploadedDocs
      ? (language === "hi"
          ? "आपके द्वारा अपलोड किए गए बिलों के आधार पर मैं आपका बहीखाता देख सकता हूँ। कृपया किसी विशिष्ट बिल या ग्राहक का नाम पूछें।"
          : "Based on your uploaded bills, I can view your historical invoices. Ask me about any specific bill, party, or amount.")
      : responseText(id, language);

    return {
      id: crypto.randomUUID(),
      role: "assistant",
      text: fallbackText,
      promptId: id,
      evidenceIds: sources[id] || [],
      createdAt: new Date().toISOString(),
    };
  },
};

