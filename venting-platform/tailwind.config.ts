import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'calm-blue': {
          light: '#A7C7E7', // Light blue
          DEFAULT: '#72A0C1', // Steel blue
          dark: '#4863A0',  // Royal blue
        },
        'calm-purple': {
          light: '#D8BFD8', // Thistle
          DEFAULT: '#9370DB', // Medium Purple
          dark: '#6A0DAD',  // Purple
        },
        'neutral': {
          light: '#F5F5F5', // White Smoke
          DEFAULT: '#D3D3D3', // Light Gray
          dark: '#A9A9A9',  // Dark Gray
          darker: '#696969', // DimGray
        },
        // Add dark mode specific color variations if needed, e.g.
        'dark-bg': '#1a202c', // Example dark background
        'dark-card': '#2d3748', // Example dark card background
        'dark-text': '#e2e8f0', // Example dark text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // dm: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
