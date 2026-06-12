import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAuthStore } from '@/lib/store/auth-store'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Extracts initials from a given name (maximum 2 characters)
 * e.g. "John Thor" -> "JT", "Muhammad Abiyyu" -> "MA"
 */
export function getInitials(name: string): string {
	if (!name) return 'U'
	const words = name.trim().split(/\s+/)
	if (words.length === 0 || words[0] === '') return 'U'

	// If it's a single word and looks like a UID (long, no spaces, starts with X or other common Firebase ID chars)
	// many Firebase IDs start with X3 or other patterns that look bad as initials
	if (words.length === 1 && words[0].length > 20) {
		return words[0].charAt(0).toUpperCase()
	}

	if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
	return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Generates an avatar URL using avatar.vercel.sh
 * @param name The display name to extract initials from
 * @param seed Optional underlying seed to generate the geometric pattern (usually userId)
 */
export function getAvatarUrl(name: string, seed?: string): string {
	const initials = getInitials(name)
	const identifier = seed || name
	return `https://avatar.vercel.sh/${encodeURIComponent(identifier)}.svg?text=${encodeURIComponent(initials)}`
}

/**
 * Resolves private Cloudflare R2 media URLs by routing them through the backend download proxy
 */
export function getMediaUrl(url: string | null | undefined): string | undefined {
	if (!url) return undefined
	if (url.startsWith('blob:')) return url
	if (url.includes('assets.papernest.com')) {
		const baseUrl =
			typeof window !== 'undefined'
				? '/api'
				: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
		const { accessToken } = useAuthStore.getState()
		const tokenParam = accessToken ? `&token=${accessToken}` : ''
		const result = `${baseUrl}/upload/download?url=${encodeURIComponent(url)}${tokenParam}`
		return result
	}
	return url
}

/**
 * Preprocesses LaTeX delimiters from LLM output (like \( ... \) and \[ ... \])
 * into standard dollar signs ($ and $$) that are recognized by remark-math/streamdown.
 */
export function preprocessLatex(content: string): string {
	if (!content) return ''
	return content
		.replace(/\\\\\[/g, '$$$$')
		.replace(/\\\\\]/g, '$$$$')
		.replace(/\\\\\(/g, '$$')
		.replace(/\\\\\)/g, '$$')
		.replace(/\\\[/g, '$$$$')
		.replace(/\\\]/g, '$$$$')
		.replace(/\\\(/g, '$$')
		.replace(/\\\)/g, '$$')
}
