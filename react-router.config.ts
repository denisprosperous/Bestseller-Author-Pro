import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode for static deployment
  ssr: false,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
