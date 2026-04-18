import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
