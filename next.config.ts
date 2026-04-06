import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	async rewrites() {
		// If NEXT_PUBLIC_API_URL ends with /api, we map /api/x to NEXT_PUBLIC_API_URL/x
		// We'll clean up any trailing slashes to be safe.
		const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000/api';
		
		return [
			{
				source: '/api/:path*',
				destination: `${backendUrl}/:path*`,
			},
		]
	},
}

export default nextConfig
