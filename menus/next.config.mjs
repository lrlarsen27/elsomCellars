/** @type {import('next').NextConfig} */
const nextConfig = {
  // The whole app is static. Nothing renders on a server at request time, so
  // it can be served from any static host — see `README.md`.
  output: "export",

  // Emit `out/menu/food/index.html` rather than `out/menu/food.html`. Without
  // this, whether the deployed URL resolves depends on how the host handles
  // extensionless requests, which turns the winery's only link into a
  // host-configuration detail.
  trailingSlash: true,
};

export default nextConfig;
