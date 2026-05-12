/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "sans-serif"] },
      colors: {
        gray: {
          950: "#0a0f1a",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "slide-in": "slideIn 0.22s ease-out",
        "scale-in": "scaleIn 0.18s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
