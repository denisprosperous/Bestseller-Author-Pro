// Vercel serverless function to serve React Router v7 app
import { createRequestHandler } from "@react-router/node";
import { installGlobals } from "@react-router/node";

installGlobals();

// Import the server build
const build = await import("../project/build/server/index.js");

export default createRequestHandler({ build });
