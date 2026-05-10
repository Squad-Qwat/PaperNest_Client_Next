import { FileBox, FileCode, FileImage, FileText, Folder, FolderOpen } from 'lucide-react'
import type { TreeDataItem } from '@/components/tree-view'
import type { DocumentFile } from '@/lib/api/types/document.types'

/**
 * Gets the appropriate icon for a file based on its extension or mime type
 */
export const getFileIcon = (name: string, type?: string) => {
	if (type?.startsWith('image/')) return FileImage
	if (name.endsWith('.tex') || name.endsWith('.sty') || name.endsWith('.cls')) return FileCode
	if (name.endsWith('.bib')) return FileBox
	return FileText
}

/**
 * Transforms a flat array of DocumentFiles into a hierarchical TreeDataItem structure
 */
export const buildFileTree = (
	files: DocumentFile[],
	actionsRenderer: (file: DocumentFile) => React.ReactNode
): TreeDataItem[] => {
	const root: TreeDataItem[] = []
	const folderMap: Record<string, TreeDataItem> = {}

	files.forEach((file) => {
		const parts = file.name.split('/')
		let currentLevel = root

		parts.forEach((part, index) => {
			const isLast = index === parts.length - 1
			const pathSoFar = parts.slice(0, index + 1).join('/')

			if (isLast) {
				currentLevel.push({
					id: file.fileId,
					name: part,
					icon: getFileIcon(file.name, file.type),
					metadata: { fullName: file.name },
					actions: actionsRenderer(file),
				})
			} else {
				if (!folderMap[pathSoFar]) {
					const newFolder: TreeDataItem = {
						id: `folder-${pathSoFar}`,
						name: part,
						icon: Folder,
						openIcon: FolderOpen,
						children: [],
					}
					folderMap[pathSoFar] = newFolder
					currentLevel.push(newFolder)
				}
				currentLevel = folderMap[pathSoFar].children!
			}
		})
	})

	sortTreeItems(root)
	return root
}

/**
 * Sorts tree items: Folders first, then Files, both alphabetically
 */
const sortTreeItems = (items: TreeDataItem[]) => {
	items.sort((a, b) => {
		const aIsFolder = !!a.children
		const bIsFolder = !!b.children

		if (aIsFolder && !bIsFolder) return -1
		if (!aIsFolder && bIsFolder) return 1
		return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
	})

	for (const item of items) {
		if (item.children) {
			sortTreeItems(item.children)
		}
	}
}
