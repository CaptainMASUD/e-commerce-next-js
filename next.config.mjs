/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // optional (more strict): only allow your cloudinary account path
        // pathname: "/dwj5oqpqz/**",
      },
    ],
  },
};

export default nextConfig;