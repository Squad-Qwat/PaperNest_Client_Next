import createMiddleware from 'next-intl/middleware'

export const proxy = createMiddleware({
	locales: ['en', 'id'],
	defaultLocale: 'en',
})

export const config = {
	// Match only internationalized pathnames
	matcher: ['/', '/(en|id)/:path*', '/((?!_next|api|.*\\.).*)'],
}
