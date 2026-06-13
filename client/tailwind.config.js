/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#04131d',
        ember: '#ff6b2c',
        sand: '#f5efe5',
        mint: '#8cf0c0',
        ocean: '#103047',
      },
      boxShadow: {
        glow: '0 20px 80px rgba(255, 107, 44, 0.16)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
