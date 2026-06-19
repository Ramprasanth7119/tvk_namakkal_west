import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tvknamakkaleast.com",
        pathname: "/**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/api/voter/verify": ["./lib/Voter_List.xlsx"],
  },
};

export default nextConfig;
