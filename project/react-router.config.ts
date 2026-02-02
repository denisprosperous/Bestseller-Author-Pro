import type { Config } from "@react-router/dev/config";

export default {
  // Enable SSR for Vercel deployment
  ssr: true,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
