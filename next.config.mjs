/** @type {import('next').NextConfig} */

// When building for GitHub Pages we produce a fully static export.
// (Server features like the email API route don't run on Pages — they are
//  excluded from the static build; the Excel download works client-side.)
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        output: "export",
        basePath,
        assetPrefix: basePath ? `${basePath}/` : undefined,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
