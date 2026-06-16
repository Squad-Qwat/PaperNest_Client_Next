import type { Metadata } from 'next'
import { DM_Mono, IBM_Plex_Mono, IBM_Plex_Sans, Source_Code_Pro } from 'next/font/google'
import '@/app/css/globals.css'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { AppProvider } from '@/lib/store'

const ibmPlexSans = IBM_Plex_Sans({
	variable: '--font-ibmPlex-sans',
	subsets: ['latin'],
})

const ibmPlexMono = IBM_Plex_Mono({
	variable: '--font-ibmPlex-mono',
	subsets: ['latin'],
	weight: ['100', '400', '700'],
	display: 'swap',
})

const sourceCodePro = Source_Code_Pro({
	variable: '--font-sourceCodePro',
	subsets: ['latin'],
	weight: ['200', '400', '600', '700'],
	display: 'swap',
})

const dmMono = DM_Mono({
	variable: '--font-dmMono',
	subsets: ['latin'],
	weight: ['300', '400', '500'],
	display: 'swap',
})

export const metadata: Metadata = {
	title: 'PaperNest',
	description: 'Organize your research like never before',
}

interface LocaleLayoutProps {
	children: React.ReactNode
	params: Promise<any>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
	const { locale } = await params
	const locales = ['en', 'id']
	if (!locales.includes(locale)) {
		notFound()
	}

	const messages = await getMessages()

	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${sourceCodePro.variable} ${dmMono.variable} antialiased`}
			>
				<NextIntlClientProvider messages={messages}>
					<ThemeProvider
						attribute='class'
						defaultTheme='system'
						enableSystem
						disableTransitionOnChange
					>
						<QueryProvider>
							<AuthProvider>
								<NotificationProvider>
									<TooltipProvider>
										<AppProvider>{children}</AppProvider>
									</TooltipProvider>
									<Toaster position='bottom-right' richColors closeButton />
								</NotificationProvider>
							</AuthProvider>
						</QueryProvider>
					</ThemeProvider>
				</NextIntlClientProvider>

				<Script id='maze-universal-snippet' strategy='afterInteractive'>
					{`
						(function (m, a, z, e) {
							var s, t, u, v;
							try {
								t = m.sessionStorage.getItem('maze-us');
							} catch (err) {}

							if (!t) {
								t = new Date().getTime();
								try {
									m.sessionStorage.setItem('maze-us', t);
								} catch (err) {}
							}

							u = document.currentScript || (function () {
								var w = document.getElementsByTagName('script');
								return w[w.length - 1];
							})();
							v = u && u.nonce;

							s = a.createElement('script');
							s.src = z + '?apiKey=' + e;
							s.async = true;
							if (v) s.setAttribute('nonce', v);
							a.getElementsByTagName('head')[0].appendChild(s);
							m.mazeUniversalSnippetApiKey = e;
						})(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '3aff206f-c4ab-488e-ba08-0584c1b5eacd');
					`}
				</Script>
			</body>
		</html>
	)
}
