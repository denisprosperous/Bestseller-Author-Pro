import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("brainstorm", "routes/brainstorm.tsx"),
  route("builder", "routes/builder.tsx"),
  route("preview", "routes/preview.tsx"),
  route("audiobooks", "routes/audiobooks.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
