import type { NextConfig } from "next";
const outputMode = process.env.NEXT_OUTPUT_MODE === "standalone" ? "standalone" : (process.env.NEXT_OUTPUT_MODE === "export" ? "export" : (process.env.NODE_ENV === "production" ? "standalone" : undefined));
const config: NextConfig = { output: outputMode, images: { unoptimized: true }, devIndicators: false, turbopack: { root: process.cwd() } };
export default config;
