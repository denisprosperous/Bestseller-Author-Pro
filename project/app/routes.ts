import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("brainstorm", "routes/brainstorm.tsx"),
  route("builder", "routes/builder.tsx"),
  route("preview", "routes/preview.tsx"),
  route("api/keys", "routes/api.keys.ts"),
  route("api/keys/secure", "routes/api.keys.secure.ts"),
  route("api/encryption", "routes/api.encryption.ts"),
] satisfies RouteConfig;
