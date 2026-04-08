import _default, { setImportWasmModule } from './typst_ts_web_compiler.mjs'

export * from './typst_ts_web_compiler.mjs'
export default _default

const nodeJsImportWasmModule = async (wasm_name, url) => {
	const escapeImport = new Function('m', 'return import(m)')
	const { readFileSync } = await escapeImport('fs')

	const wasmPath = new URL(wasm_name, url)
	return await readFileSync(wasmPath).buffer
}

// nodejs
const isNode =
	typeof process !== 'undefined' && process.versions != null && process.versions.node != null

if (isNode) {
	setImportWasmModule(nodeJsImportWasmModule)
}
