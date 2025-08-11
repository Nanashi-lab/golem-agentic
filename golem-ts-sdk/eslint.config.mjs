import js from '@eslint/js';
import pluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';

export default [
    {
        ignores: ['.metadata/**', 'tests/**', 'dist/**', 'types/**'], // 🚀 Ignore generated + test code
    },
    {
        files: ['src/**/*.{ts,tsx}'], // Lint only actual source
        languageOptions: {
            parser: parserTs,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
        },
        plugins: { '@typescript-eslint': pluginTs },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'no-unreachable': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            eqeqeq: ['error', 'always'],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
        },
    },
];
