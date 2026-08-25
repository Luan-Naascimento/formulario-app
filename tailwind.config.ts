import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B2545",
        teal: "#114B5F",
        canvas: "#F3F5F8",
        card: "#FFFFFF",
        gold: "#C89B3C",
        alert: "#B3261E",
        muted: "#5B6472",
        line: "#D8DEE6",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        seal: "radial-gradient(circle at 30% 30%, rgba(200,155,60,0.35), rgba(200,155,60,0) 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
