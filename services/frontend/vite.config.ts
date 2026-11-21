import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(
{
	plugins: [react()],
	resolve: {
		alias: {
			react: path.resolve(__dirname, 'node_modules/react'),
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
		},
		dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
	},
	server: {
		host: '0.0.0.0',
		port: 5173,
		https: {
			key: path.resolve(__dirname, 'certs/nginx.key'),
			cert: path.resolve(__dirname, 'certs/nginx.crt'),
		},
		allowedHosts: ['orel.page', 'www.orel.page', 'localhost'],
		hmr: {
			clientPort: 443,
		},
		watch: {
			usePolling: true
		}
	}
})
