/**
 * Custom Date Formatting Utility
 * Mimics a subset of date-fns functionality for the project's needs.
 */

// Simple locale support for Indonesian (id)
export const id = {
	code: 'id',
	months: [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember',
	],
	days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
}

interface FormatOptions {
	locale?: typeof id
}

/**
 * Formats a date string or Date object into a readable string.
 * Currently supports a limited set of tokens relevant to the project:
 * - d: Day of month
 * - MMMM: Full month name
 * - yyyy: Full year
 * - HH: Hours (24H)
 * - mm: Minutes
 *
 * Example: 'd MMMM yyyy, HH:mm' -> '15 Agustus 2023, 16:51'
 */
export function format(
	date: Date | string | number | any,
	formatStr: string,
	options?: FormatOptions
): string {
	if (!date) return '-'

	let d: Date

	try {
		if (date instanceof Date) {
			d = date
		} else if (typeof date === 'string' || typeof date === 'number') {
			d = new Date(date)
		} else if (date && typeof date === 'object') {
			if ('seconds' in date) {
				// Firestore Timestamp
				d = new Date((date as any).seconds * 1000)
			} else if ('_seconds' in date) {
				// Another Firestore variation
				d = new Date((date as any)._seconds * 1000)
			} else {
				// Try parsing as generic date object or string
				d = new Date(date as any)
			}
		} else {
			console.warn('Invalid date input type:', typeof date, date)
			return '-'
		}

		if (isNaN(d.getTime())) {
			console.warn('Invalid Date object created from:', date)
			return '-'
		}
	} catch (e) {
		console.error('Date formatting error:', e)
		return '-'
	}

	const locale = options?.locale || id

	const day = d.getDate()
	const monthIndex = d.getMonth()
	const year = d.getFullYear()
	const hours = d.getHours()
	const minutes = d.getMinutes()

	const tokens: Record<string, string> = {
		d: day.toString(),
		dd: day.toString().padStart(2, '0'),
		MMMM: locale.months[monthIndex],
		yyyy: year.toString(),
		HH: hours.toString().padStart(2, '0'),
		mm: minutes.toString().padStart(2, '0'),
	}

	return formatStr.replace(/d|dd|MMMM|yyyy|HH|mm/g, (match) => tokens[match] || match)
}
