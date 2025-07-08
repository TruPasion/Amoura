import type { Config } from "tailwindcss";
import flowbite from "flowbite/plugin";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-vue/**/*.{js,ts,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pacifico: ['"Pacifico"', "cursive"],
      },
    },
  },
  plugins: [flowbite],
};

export default config;
