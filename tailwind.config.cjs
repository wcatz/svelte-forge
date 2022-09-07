const typography = require('@tailwindcss/typography');
const forms = require('@tailwindcss/forms');

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
					accent: '#6366f1',
					neutral: '#9ca3af',
					'base-content': '#e5e7eb',
					
				}
			},
			{
				otg: {
					'base-content': '#e5e7eb',
					primary: '#e5e7eb',
					secondary: '#152747',
					accent: '#fdd202',
					neutral: '#ffff',
					'base-100': '#6b7280',
					info: '#357CED',
					success: '#487423',
					warning: '#AF6204',
					error: '#b91c1c',
					yellow: '#fdd202'
				}
			}
		],
		darkTheme: 'luxury'
	}
};

module.exports = config;
