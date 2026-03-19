/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — page cannot be embedded in an iframe on another domain
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent browsers from sniffing MIME types
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send origin in referrer, never full URL
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features that aren't needed
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Force HTTPS for 1 year (once on Vercel with HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Basic XSS protection for older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        // Allow service worker scope at root
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
