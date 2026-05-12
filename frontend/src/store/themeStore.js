import { create } from "zustand";
import { persist } from "zustand/middleware";

const THEMES = {
  blue: { primary: "37 99 235", name: "Biru" },
  purple: { primary: "124 58 237", name: "Ungu" },
  green: { primary: "5 150 105", name: "Hijau" },
  rose: { primary: "225 29 72", name: "Merah Muda" },
  orange: { primary: "234 88 12", name: "Oranye" },
  teal: { primary: "13 148 136", name: "Teal" },
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: false,
      layout: "sidebar", // 'sidebar' | 'topbar'
      themeKey: "blue",
      themes: THEMES,

      setDark: (val) => {
        set({ isDark: val });
        document.documentElement.classList.toggle("dark", val);
      },

      setLayout: (layout) => set({ layout }),

      setTheme: (key) => {
        if (!THEMES[key]) return;
        set({ themeKey: key });
        const rgb = THEMES[key].primary;
        document.documentElement.style.setProperty("--color-primary", rgb);
      },

      init: () => {
        const { isDark, themeKey } = get();
        document.documentElement.classList.toggle("dark", isDark);
        const rgb = THEMES[themeKey]?.primary || THEMES.blue.primary;
        document.documentElement.style.setProperty("--color-primary", rgb);
      },
    }),
    { name: "theme-store" },
  ),
);

export { THEMES };
export default useThemeStore;
