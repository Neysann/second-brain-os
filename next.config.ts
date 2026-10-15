import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@uiw/react-md-editor", "@uiw/react-markdown-preview"],
};

export default nextConfig;
