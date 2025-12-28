// public/TexlyreDvipdfmxEngineSetup.js
;(() => {
	// Set the path for the engine - this must match where the file is actually located
	window.ENGINE_PATH = '/core/swiftlatex/texlyredvipdfm.js'

	// Load the DvipdfmxEngine script dynamically
	const script = document.createElement('script')
	script.src = '/core/swiftlatex/DvipdfmxEngine.js'
	script.onload = () => {
		console.log('DvipdfmxEngine script loaded successfully')
		// Notify any listeners that the engine is ready
		if (window.onDvipdfmxEngineReady) {
			window.onDvipdfmxEngineReady()
		}
	}
	script.onerror = (error) => {
		console.error('Failed to load DvipdfmxEngine script', error)
	}

	window.isTeXEngineAvailable = () => typeof window.DvipdfmxEngine === 'function'

	document.head.appendChild(script)
})()
