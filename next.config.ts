import type { NextConfig } from "next";
const outputMode = process.env.NEXT_OUTPUT_MODE === "standalone" ? "standalone" : "export";
const config: NextConfig = { output: outputMode, images: { unoptimized: true }, devIndicators: false, turbopack: { root: process.cwd() } };
export default config;
