# VyaparAI frontend design system

## Product and hierarchy
Business copilot for Indian MSMEs. Fictional business: Sharma Electronics, Kanpur.
The key task is deciding what to do next. Understand → detect → prioritize → explain → act.
Overview leads with 3 prioritized actions, then financial context, a useful revenue/expense chart, business health and recent activity.
Other pages: documents, invoices, customers, vendors, inventory, expenses, insights, assistant, settings.
Local mock data only. No backend, authentication, OCR, external APIs or AI providers in the app.

## Visual source and adaptation
Adapted from Superdesign mosaic-grid-architecture-style: paper surfaces, forest/teal accent, crisp dividers and structural precision. Product brief overrides decorative mosaics, huge headers, tiny mono labels and marketing sections.
Use system sans typography (-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif), including system Devanagari fallback. No remote font dependencies.
Background #F7F8FA; white surfaces #FFFFFF; sidebar #FDFDFD; text #202B32; secondary #667179; muted #77818A; borders #E6E9EC.
Primary teal #147D70, dark teal #0E6057, pale teal #EAF5F1. Amber #946200 with background #FFF6E5; red #B3453C with background #FFF0ED; blue #4668A5 with background #EFF3FA.
One quiet orange accent in the brand wordmark. No decorative images needed; no existing brand logo supplied. Use a restrained VyaparAI typographic wordmark.
Desktop sidebar 224px, header 76px, content padding 32px, content maximum 1500px. 8px spacing system; panels 12px radius; buttons 8px radius; border 1px; no conspicuous shadows.
Typography: page title 28/36 semibold, section title 18/26 semibold, body 14/22, caption 12/18, money 27/34 with tabular numerals. Accessible contrasts, 44px mobile controls, visible focus rings.

## Components
Sidebar with grouped navigation and business profile footer. Top utility bar with breadcrumb, English/Hindi/Hinglish selector, search, notifications, avatar.
Three action cards share a single pale mint outer panel, use red/amber priority dots plus labels, evidence links and individual action buttons.
Five metrics in one unified white strip with internal separators, not floating excessive cards.
Chart: grouped bars or smooth sober lines with explicit revenue and expense labels and accessible value table.
Business health: 82/100 with compact labeled progress tracks; demo score with methodology disclosed.
Tables: comfortable 56px rows, understated uppercase labels, status pills with icons and text, monospaced IDs, right-aligned money.
Details open in a right inspector drawer; on mobile an accessible full screen sheet. One modal at a time, Escape and close button, focus trapping and restoration.
Mobile: 4 persistent bottom tabs (Overview, Documents, Insights, Assistant) and More sheet for all other destinations. Content stacks without page overflow.
Follow system dark appearance with paired semantic tokens. Respect prefers-reduced-motion.

## Data and semantics
Demo as of 5 October 2026; report September. Revenue 482000, payments 400000, receivables 82000, expenses 213000, revenue less expenses 269000 (not accounting profit).
Three overdue invoices. INV-1023, ABC Traders, 35000 due 23 Sep 2026, 0 paid, 12 days overdue. 5 products at/below reorder level; Dell monitor 8 units at 1.6/day = 5 days cover, recommend 20 units.
Electricity September 24500 vs August 19758 (~24%). All evidence references point to actual mock records.
Actions create local reminders; they do not send messages or alter financial records. All uploads are simulated; no file contents are read.
English, Hindi and Hinglish dictionaries with identical stable keys, language-sensitive mock answers, dates and INR formatting.
