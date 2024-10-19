const typography = require('@tailwindcss/typography');
const forms = require('@tailwindcss/forms');
const { secondary } = require('daisyui/src/colors');

const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '2rem',
				lg: '4rem',
				xl: '5rem',
				'2xl': '6rem'
			}
		}
	},

	plugins: [require('@tailwindcss/aspect-ratio'), require("@tailwindcss/typography"), require('daisyui'), forms, typography],
	daisyui: {
		themes: [
			{
				luxury: {
					...require('daisyui/src/colors/themes')['[data-theme=luxury]'],
					accent: '#D1D5DB',
					neutral: '#9ca3af',
					'base-content': '#e5e7eb',
					secondary: '#1F2937'
					
				}
			},
			{
				otg: {
					'base-content': '#e5e7eb',
					primary: '#1F2937',
					secondary: '#1F2937',
					accent: '#1F2937',
					neutral: '#ffff',
					'base-100': '#6b7280',
					info: '#357CED',
					success: '#487423',
					warning: '#AF6204',
					error: '#b91c1c',
					yellow: '#06B6D4'
				}
			}
		],
		darkTheme: 'luxury'
	}
};

module.exports = config;
