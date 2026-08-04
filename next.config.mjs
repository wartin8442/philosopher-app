import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep output tracing inside this project when another lockfile exists in a
  // parent directory; otherwise Next may infer the user's home as the root.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  // The embedding library loads a native ONNX runtime (.node binaries) that
  // webpack cannot bundle; load it from node_modules at runtime instead.
  serverExternalPackages: ["@xenova/transformers"],
};

export default nextConfig;
