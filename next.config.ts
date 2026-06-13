import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const createNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	async rewrites() {
		// If NEXT_PUBLIC_API_URL ends with /api, we map /api/x to NEXT_PUBLIC_API_URL/x
		// We'll clean up any trailing slashes to be safe.
		const backendUrl =
			process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000/api'

		return [
			{
				source: '/api/:path*',
				destination: `${backendUrl}/:path*`,
			},
		]
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'raw.githubusercontent.com',
			},
		],
	},
}

export default withSentryConfig(createNextIntl(nextConfig), {
	org: 'papernest',
	project: 'papernest-client',
	silent: true,
	widenClientFileUpload: true,
	disableLogger: true,
})
