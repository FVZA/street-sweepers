import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the schedule CSV into the /api/streets serverless function —
  // Vercel's file tracing doesn't detect fs.readFileSync of loose files
  outputFileTracingIncludes: {
    "/api/streets": ["./Street_Sweeping_Schedule_20251017.csv"],
  },
};

export default nextConfig;
