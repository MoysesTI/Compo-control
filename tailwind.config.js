/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            light: '#5C9CE5', // Azul claro
            DEFAULT: '#2E78D2', // Azul principal
            dark: '#1A5FB5',   // Azul escuro
          },
          secondary: {
            light: '#F5EFE0', // Bege claro
            DEFAULT: '#E8DCC5', // Bege principal
            dark: '#D0BC9D',   // Bege escuro
          },
          neutral: {
            white: '#FFFFFF',
            light: '#F7F7F7',
            DEFAULT: '#EFEFEF',
            dark: '#D9D9D9',
          },
          accent: {
            success: '#4CAF50', // Verde
            warning: '#FFC107', // Amarelo
            danger: '#F44336',  // Vermelho
            info: '#03A9F4',    // Azul informativo
          }
        },
      },
    },
    plugins: [],
  }