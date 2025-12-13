/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'retro-teal': '#2D7A7A',
        'retro-coral': '#E8846B',
        'retro-mustard': '#D4A84B',
        'retro-pink': '#E8B4B4',
        'retro-green': '#4A7C59',
        'retro-cream': '#F5F0E6',
        'retro-charcoal': '#3D3D3D',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
