import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { Shell } from "@/components/layout/shell";
import "./globals.css";
export const metadata: Metadata={title:"VyaparAI — Your business copilot",description:"A frontend prototype for Sharma Electronics. Understand what needs attention, why it matters, and what to do next."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppProvider><Shell>{children}</Shell></AppProvider></body></html>;}
