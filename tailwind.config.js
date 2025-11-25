/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald 500
          foreground: '#FFFFFF',
        },
        background: '#F3F4F6', // Gray 100
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
