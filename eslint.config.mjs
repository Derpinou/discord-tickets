import { defineConfig, globalIgnores } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

// Formatting rules come from @stylistic: they replace ESLint's deprecated core rules
// of the same name (same options) and also understand TypeScript syntax.
export default defineConfig([
	globalIgnores(['lib/']),
	{
		files: ['**/*.{ts,js,mjs}'],
		languageOptions: {
			parser: tseslint.parser
		},
		plugins: {
			'@stylistic': stylistic,
			'@typescript-eslint': tseslint.plugin
		},
		rules: {
			'@stylistic/semi': ['error', 'always'], // ;
			'@stylistic/quotes': ['error', 'single', { avoidEscape: true }], // '
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignore unused vars starting with '_'
			'eqeqeq': ['error', 'always'], // == -> ===
			'@stylistic/indent': ['error', 'tab'], // Force tab for tabs
			'@stylistic/comma-dangle': ['error', 'never'], // No ',' on the last element of array/json
			'@stylistic/no-trailing-spaces': 'error', // In the name
			'@stylistic/keyword-spacing': 'error', // eg: "if()" -> "if ()"
			'@stylistic/space-before-blocks': 'error', // eg: "if (){}" -> "if () {}"
			'@stylistic/object-curly-spacing': ['error', 'always'], // eg: const obj = {a: 1}; -> const obj = { a: 1 };
			'@stylistic/arrow-spacing': 'error', // "(a)=>" -> "(a) =>"
			'@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
			'@stylistic/space-infix-ops': 'error', // "1+2" -> "1 + 2"
			'@stylistic/key-spacing': 'error', // Space after ":"
			'@stylistic/comma-spacing': 'error', // Space after ","
			'@stylistic/array-bracket-spacing': ['error', 'never'],
			'no-var': 'error',
			'prefer-const': 'error'
		}
	},
	{
		files: ['tests/**/*.js'],
		languageOptions: {
			sourceType: 'commonjs'
		}
	}
]);
