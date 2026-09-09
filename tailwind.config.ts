import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { fontFamily: { poppins: ["Poppins", "sans-serif"] }, colors: { primary: "#1d4ed8", danger: "#dc2626" } } },
  plugins: [],
};
export default config;