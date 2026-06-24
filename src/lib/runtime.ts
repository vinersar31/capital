/**
 * True when the app was built as a static export for GitHub Pages.
 * Server-only features (email / monthly auto-email) are disabled in this mode;
 * the Excel download still works because it is generated client-side.
 */
export const IS_STATIC_EXPORT =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
