import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas', 'pdfjs-dist', 'tesseract.js'],
};

export default nextConfig;
