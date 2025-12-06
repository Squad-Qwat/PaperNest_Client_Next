/**
 * diff.ts
 * Utilities for calculating differences between strings and generating CodeMirror changes.
 */

export interface CodeMirrorChange {
	from: number;
	to: number;
	insert: string;
}

/**
 * Computes a minimal set of changes to transform oldDoc into newDoc.
 * Current implementation uses a fast Longest Common Prefix/Suffix approach,
 * which is highly effective for localized edits typical of AI tool usage.
 */
export function computeCodeMirrorChanges(oldDoc: string, newDoc: string): CodeMirrorChange[] {
	if (oldDoc === newDoc) return [];

	let start = 0;
	let oldEnd = oldDoc.length;
	let newEnd = newDoc.length;

	// Find common prefix
	while (start < oldEnd && start < newEnd && oldDoc[start] === newDoc[start]) {
		start++;
	}

	// Find common suffix
	while (oldEnd > start && newEnd > start && oldDoc[oldEnd - 1] === newDoc[newEnd - 1]) {
		oldEnd--;
		newEnd--;
	}

	// The change is from 'start' to 'oldEnd' in the original doc,
	// being replaced by the substring from 'start' to 'newEnd' in the new doc.
	return [
		{
			from: start,
			to: oldEnd,
			insert: newDoc.slice(start, newEnd),
		},
	];
}
