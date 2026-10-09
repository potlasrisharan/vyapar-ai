# VyaparAI 🇮🇳

> **Autonomous AI Financial Copilot for Indian MSMEs & Retail Merchants**

VyaparAI is a lightweight, mobile-first financial management dashboard and AI copilot designed specifically for Indian micro, small, and medium enterprises (MSMEs). Engineered with high-affordance touch ergonomics and dual-language clarity (English, Hindi, Hinglish), it eliminates complex enterprise jargon so non-tech-savvy merchants can run their shops with confidence.

---

## 🌟 Key Features

- ☀️ **Daily Shop Briefing (*Aaj Ki Sthiti*)**: Instant morning summary displaying pending market collections, overdue bills, and low inventory items with 1-tap reminder triggers.
- 🧾 **Fast Invoicing (10-Second Billing)**: Rapid GST-compliant invoice generation with one-click A4/thermal tax invoice printing.
- 💰 **Payment Reconciliation (*Udhaari Vasooli*)**: Frictionless payment collection ledger, tracking customer balances and aging receivables.
- 📄 **Document & Bill OCR**: Upload or take photos of paper bills, receipts, or supplier invoices for automated structured data extraction.
- 🎙️ **Multilingual Voice & Text Copilot**: Powered by Sarvam AI (`sarvam-105b`, `saaras:v2` STT, `bulbul:v3` TTS). Ask business questions by voice in Hindi, Hinglish, or English.
- 🔔 **Action Center**: Prioritized financial actions, automated WhatsApp payment reminder drafts, and vendor restock alerts.
- 🔒 **Clean Light Architecture**: High-contrast, accessibility-first design with 0 AI slop, zero pill badges, and minimum 44px–76px touch targets.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/) + [Lucide Icons](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom High-Affordance Design System
- **Language Models & Voice**: [Sarvam AI](https://sarvam.ai) (Indic LLM, Indic STT, Indic TTS)
- **Quality Assurance**: [Playwright](https://playwright.dev/) (Full responsive matrix: 320px to 1440px) + Node.js Native Test Runner
- **Deployment**: [AWS Amplify Hosting](https://aws.amazon.com/amplify/) + CloudFront Edge CDN

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/potlasrisharan/vyapar-ai.git
   cd vyapar-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```bash
   SARVAM_API_KEY=your_sarvam_api_key_here
   AWS_REGION=ap-southeast-2
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Assurance

VyaparAI maintains a comprehensive test suite covering arithmetic ledger reconciliation, multilingual responses, and responsive viewports:

```bash
# Typecheck TypeScript
npm run typecheck

# Run ESLint
npm run lint

# Run Ledger & Knowledge Graph Unit Tests
npm test

# Run Playwright End-to-End Suite (Responsive: 320px, 390px, 768px, 1024px, 1440px)
npm run test:e2e
```

---

## 🚢 Production Build & Deployment

To build a standalone static export:

```bash
npm run build
```

The optimized static files are emitted to the `out/` directory, ready for deployment to AWS Amplify, Cloudflare Pages, or Vercel.

---

## 📄 License

Private & Proprietary. All rights reserved.
