'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LOCALES = [
	{ code: 'en', label: 'English', flag: '🇺🇸' },
	{ code: 'id', label: 'Bahasa', flag: '🇮🇩' },
] as const

type LocaleCode = (typeof LOCALES)[number]['code']

export function LocaleSwitcher() {
	const router = useRouter()
	const pathname = usePathname()
	const params = useParams()
	const currentLocale = (params.locale as LocaleCode) ?? 'en'

	const switchLocale = (locale: LocaleCode) => {
		if (locale === currentLocale) return
		// Replace /en/... or /id/... prefix with the new locale
		const newPath = pathname.replace(/^\/(en|id)/, `/${locale}`)
		router.push(newPath)
	}

	const current = LOCALES.find((l) => l.code === currentLocale)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='ghost'
					size='sm'
					className='h-9 gap-1.5 px-3 rounded-lg text-xs font-medium'
				>
					<span>{current?.flag}</span>
					<span className='uppercase'>{currentLocale}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				{LOCALES.map((locale) => (
					<DropdownMenuItem
						key={locale.code}
						onClick={() => switchLocale(locale.code)}
						className='cursor-pointer gap-2'
						data-active={locale.code === currentLocale}
					>
						<span>{locale.flag}</span>
						<span>{locale.label}</span>
						{locale.code === currentLocale && (
							<span className='ml-auto text-primary text-xs'>✓</span>
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
