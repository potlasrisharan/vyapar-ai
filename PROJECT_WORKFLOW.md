# VyaparAI — Project Workflow & Changelog

## 📌 Overview
**VyaparAI** is an AI-powered business copilot designed specifically for Indian MSMEs (Retailers, Distributors, Small Business Owners). It operates on a single core operational philosophy:

$$\text{UNDERSTAND} \longrightarrow \text{DETECT} \longrightarrow \text{PRIORITIZE} \longrightarrow \text{EXPLAIN} \longrightarrow \text{ACT}$$

**Primary Demo Business:** *Sharma Electronics* (Kanpur, Uttar Pradesh).

---

## 🌐 Live Production & Repository Links
- **Production URL:** [https://main.d1ab5s5n2wzi84.amplifyapp.com](https://main.d1ab5s5n2wzi84.amplifyapp.com)
- **AWS Infrastructure:** AWS Amplify + CloudFront Edge CDN + S3 Storage
- **AWS Region:** `ap-southeast-2` (Sydney)
- **AWS Account ID:** `496178998121` (Profile: `avinya`)
- **GitHub Repository (Private):** [https://github.com/potlasrisharan/vyaparai](https://github.com/potlasrisharan/vyaparai)
- **Branches:** `main` (Production), `dev` (Development)

---

## 🏗️ Architecture & Stack
- **Framework:** Next.js 16 (Turbopack, App Router, TypeScript)
- **Styling & UI:** Tailwind CSS, Apple Human Interface Guidelines (clean typography, subtle borders, high information density)
- **Language Support:** English, Hindi (हिंदी), and Hinglish with zero-latency switching
- **Indic AI Provider:** [Sarvam AI](https://sarvam.ai)
  - **LLM Reasoning:** `sarvam-105b` (Conversations model with Indic context)
  - **Speech-to-Text (STT):** `saaras:v2` (Voice input for non-technical shop owners)
  - **Text-to-Speech (TTS):** `bulbul:v3` (Audio voice readout of insights)
  - **Document Extraction:** Structured financial invoice parsing into JSON
- **Containers:** Multi-stage `Dockerfile` and `docker-compose.yml` (Web, PostgreSQL 16, Redis 7)

---

## 🔄 End-to-End User Workflow

```
1. Shop Owner speaks/uploads invoice
       ↓
2. Sarvam AI (Saaras STT / Document Parser)
       ↓
3. Entity Knowledge Graph & Domain Event Bus
       ↓
4. Financial Reconciliation & Anomaly Detection
   • Cash flow check (Revenue: ₹4,82,000 | Receivables: ₹82,000)
   • Overdue debtors flagged (Rahul Traders: ₹48,000)
   • Critical inventory warnings (12 low-stock SKUs)
       ↓
5. Daily Prioritized Action Plan (3-5 items)
       ↓
6. Action Center & Follow-Up (WhatsApp payment links, restock orders)
       ↓
7. Voice Assistant Readout (Sarvam Bulbul TTS)
```

---

## 🛠️ Summary of Changes Made

### 1. Indic AI & Voice Integration (Sarvam AI)
- Created [`lib/services/sarvam.ts`](lib/services/sarvam.ts) connecting directly to Sarvam API endpoints.
- Built 4 dedicated Next.js backend API routes:
  - `/api/ai/chat`: Business reasoning prompt with Sharma Electronics context.
  - `/api/ai/voice/stt`: Audio recording transcription in Hindi & English.
  - `/api/ai/voice/tts`: Voice generation for hands-free audio playback.
  - `/api/ai/ocr`: Structured JSON invoice parsing from raw text.
- Added interactive **Microphone recording** and **Voice speaker buttons** to [`components/assistant/assistant-page.tsx`](components/assistant/assistant-page.tsx).

### 2. Domain & Business Architecture
- Built [`lib/domain/events.ts`](lib/domain/events.ts) for typed decoupled domain event messaging.
- Built [`lib/domain/knowledge.ts`](lib/domain/knowledge.ts) for bi-directional entity graphs (linking invoices, payments, customers, and stock).
- Built [`lib/domain/ai-router.ts`](lib/domain/ai-router.ts) for task-based AI model delegation.
- Built dedicated Payments module in [`components/payments/payments-page.tsx`](components/payments/payments-page.tsx).

### 3. AWS Infrastructure Setup & Live Deployment
- Installed and configured AWS CLI `2.37.10`.
- Authenticated with user's AWS account `496178998121` under profile `avinya`.
- Provisioned AWS Amplify App `vyaparai` (`d1ab5s5n2wzi84`) in `ap-southeast-2`.
- Deployed production artifacts across CloudFront global edge CDN with HTTP/2 200 verification.

### 4. Git & Security
- Initialized Git repository, created private GitHub repository `potlasrisharan/vyaparai`.
- Enforced strict credential isolation: `.env*` stored locally and git-ignored.
- Code passes all 5 unit tests, 14 E2E Playwright tests, zero TypeScript errors, and zero lint warnings.

### 5. High-End Visual Design & Frictionless Navigation System
- **Typography:** Upgraded to Plus Jakarta Sans paired with JetBrains Mono for tabular and numeric business records.
- **Micro-Interactions & Hardware Aesthetics:** Nested double-bezel concentric cards (`--radius-lg`, `--radius-md`), ambient radial mesh illumination, and island pill CTAs with button-in-button trailing action discs.
- **Frictionless Navigation:**
  - Global `⌘K` keyboard shortcut for instant multi-search across invoices, documents, customers, and operations.
  - Categorized sidebar (`Workspace`, `Operations`) with active indicators.
  - Header quick-jump bar with one-click direct access to `Invoices`, `Payments`, and `Ask AI`.
  - Notification action center badge with real-time pulse dot.
  - Floating frosted-glass island bottom bar for mobile screens.
- **Adaptive Dark Mode:** 100% compliant high-contrast color tokens across light and dark palettes without hardcoded color values.
- **Zero Horizontal Overflow:** Rigorously tested and verified across 320px, 390px, 768px, 1024px, and 1440px viewports.
