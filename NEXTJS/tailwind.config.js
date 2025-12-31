/** @type {import('tailwindcss').Config} */
export const content = [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Points to your 'src' folder
];
export const theme = {
    extend: {},
};
export const plugins = [
    require('@tailwindcss/typography'), // Enables the formatting
];
export const darkMode = 'class';