import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { bg:'#080f20', panel:'#101c32', accent:'#887bff', aqua:'#33dcc1' } } }, plugins: [] } satisfies Config;
