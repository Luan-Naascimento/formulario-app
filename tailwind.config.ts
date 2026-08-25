import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#c93d05",
        teal: "#000000",
        canvas: "#F3F5F8",
        card: "#FFFFFF",
        gold: "#fcfcfc",
        alert: "#B3261E",
        muted: "#7d8188",
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
