import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // הפסקת כל האזהרות של Supabase באגרסיביות
    config.infrastructureLogging = {
      level: 'error',
    };
    
    config.stats = {
      warnings: false,
      warningsFilter: [
        /Critical dependency/,
        /the request of a dependency is an expression/,
        /@supabase/,
        /realtime-js/
      ]
    };
    
    // הסתרת אזהרות webpack
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      return entries;
    };
    
    // חסימת אזהרות לגמרי
    config.ignoreWarnings = [
      /Critical dependency/,
      /the request of a dependency is an expression/,
      { module: /node_modules\/@supabase/ },
      { file: /node_modules\/@supabase/ }
    ];
    
    return config;
  },
  
  // חסימת לוגים של Next.js
  logging: {
    fetches: {
      fullUrl: false
    }
  }
}

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};


export default nextConfig;
