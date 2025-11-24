import type { Config } from 'tailwindcss';
import flowbite from 'flowbite/plugin';

export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,ts,tsx}',
		'./public/**/*.html',
		'./node_modules/flowbite/**/*.js',
	],
	plugins: [flowbite],
} satisfies Config;
