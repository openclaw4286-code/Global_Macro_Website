import type { Config } from "tailwindcss";

// 모든 색은 908-doha-ui 디자인 토큰의 CSS 변수를 참조합니다.
// 카테고리 색은 schema/lesson.ts의 CATEGORY_COLORS와 1:1 일치하는 hex 값입니다.
// 다크모드 도입 시 카테고리 색을 CSS 변수로 빼고 라이트/다크 두 값을 가질 것.

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          layered: "var(--surface-layered)",
          sunken: "var(--surface-sunken)",
          inverse: "var(--surface-inverse)",
        },
        fg: {
          DEFAULT: "var(--text-primary)",
          muted: "var(--text-secondary)",
          subtle: "var(--text-tertiary)",
          inverted: "var(--text-inverted)",
        },
        link: "var(--text-link)",
        line: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        brand: {
          DEFAULT: "var(--accent-brand)",
          hover: "var(--accent-brand-hover)",
          press: "var(--accent-brand-press)",
          soft: "var(--accent-brand-soft)",
        },
        positive: {
          DEFAULT: "var(--state-positive)",
          soft: "var(--state-positive-soft)",
        },
        negative: {
          DEFAULT: "var(--state-negative)",
          soft: "var(--state-negative-soft)",
        },
        warning: {
          DEFAULT: "var(--state-warning)",
          soft: "var(--state-warning-soft)",
        },
        info: {
          DEFAULT: "var(--state-info)",
          soft: "var(--state-info-soft)",
        },
        category: {
          policy: "#378ADD",
          trade: "#1D9E75",
          commodity: "#EF9F27",
          risk: "#D85A30",
          tech: "#7F77DD",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        "elev-1": "var(--elev-1)",
        "elev-2": "var(--elev-2)",
        "elev-3": "var(--elev-3)",
        "elev-4": "var(--elev-4)",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "title-1": ["32px", { lineHeight: "40px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "title-2": ["26px", { lineHeight: "34px", letterSpacing: "-0.012em", fontWeight: "600" }],
        "title-3": ["22px", { lineHeight: "30px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-1": ["18px", { lineHeight: "26px", letterSpacing: "-0.006em", fontWeight: "600" }],
        "heading-2": ["16px", { lineHeight: "24px", letterSpacing: "-0.004em", fontWeight: "600" }],
        "body-1": ["16px", { lineHeight: "26px", letterSpacing: "-0.003em", fontWeight: "400" }],
        "body-2": ["14px", { lineHeight: "22px", letterSpacing: "-0.002em", fontWeight: "400" }],
        label: ["13px", { lineHeight: "18px", letterSpacing: "0", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "16px", letterSpacing: "0", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};

export default config;
