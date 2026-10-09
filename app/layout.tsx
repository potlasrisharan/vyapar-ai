import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { Shell } from "@/components/layout/shell";
import "./globals.css";
export const metadata: Metadata={title:"VyaparAI — Your business copilot",description:"A frontend prototype for Sharma Electronics. Understand what needs attention, why it matters, and what to do next.",icons:{icon:"data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%230F172A%22/><path d=%22M9 9h14M9 14h10M9 19h6l6 6%22 stroke=%22%232563EB%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppProvider><Shell>{children}</Shell></AppProvider></body></html>;}
