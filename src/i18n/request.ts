import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

const locales = ['en', 'id']

export default getRequestConfig(async ({ requestLocale }) => {
	const locale = await requestLocale
	const activeLocale = locale || 'en'
	console.log(
		'>>> [next-intl] getRequestConfig resolved requestLocale:',
		locale,
		'activeLocale:',
		activeLocale
	)
	if (!locales.includes(activeLocale)) notFound()

	return {
		locale: activeLocale,
		messages: (await import(`../../messages/${activeLocale}.json`)).default,
	}
})
