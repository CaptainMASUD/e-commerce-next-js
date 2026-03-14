export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/login", "/profile", "/register"],
      },
    ],
    sitemap: "https://aura-ohm-six.vercel.app/sitemap.xml",
  };
}