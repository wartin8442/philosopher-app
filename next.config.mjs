/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The embedding library loads a native ONNX runtime (.node binaries) that
  // webpack cannot bundle; load it from node_modules at runtime instead.
  serverExternalPackages: ["@xenova/transformers"],
};

export default nextConfig;
