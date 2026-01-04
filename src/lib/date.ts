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
export function format(date: Date | string | number, formatStr: string, options?: FormatOptions): string {
	const d = new Date(date)
    if (isNaN(d.getTime())) {
        return 'Invalid Date'
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
