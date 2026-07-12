import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      colors: {
        ink: {
          950: "#0b0b0d",
          900: "#131317",
          800: "#1c1c22",
          700: "#26262e",
          600: "#33333d",
        },
        parchment: "#e8e2d4",
        muted: "#9a948a",
      },
    },
  },
  plugins: [],
};

export default config;
