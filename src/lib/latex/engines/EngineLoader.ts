// src/extensions/switftlatex/EngineLoader.ts
const loadedScripts = new Set<string>()

export const EngineLoader = {
	async loadScript(src: string): Promise<void> {
		if (loadedScripts.has(src)) {
			return Promise.resolve()
		}

		return new Promise((resolve, reject) => {
			const script = document.createElement('script')
			script.src = src
			script.onload = () => {
				loadedScripts.add(src)
				resolve()
			}
			script.onerror = (_error) => {
				reject(new Error(`Failed to load script: ${src}`))
			}
			document.head.appendChild(script)
		})
	},

	async loadScripts(scripts: string[]): Promise<void> {
		for (const script of scripts) {
			await this.loadScript(script)
		}
	},

	isScriptLoaded(src: string): boolean {
		return loadedScripts.has(src)
	},

	removeScript(src: string): void {
		const script = document.querySelector(`script[src="${src}"]`)
		if (script) {
			script.remove()
			loadedScripts.delete(src)
		}
	},
}
