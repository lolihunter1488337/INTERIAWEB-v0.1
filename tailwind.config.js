export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["Space Grotesk", "sans-serif"],
        serif: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        ink: "#fafafa",
        muted: "#71717a",
        faint: "#3f3f46",
        bg: "#09090b",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shine: { "0%,100%": { backgroundPosition: "50% 0%" }, "50%": { backgroundPosition: "50% 100%" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        shine: "shine 7s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
