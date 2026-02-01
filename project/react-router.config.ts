import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode for static deployment on Vercel
  ssr: false,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
