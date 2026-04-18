import { nanoid } from 'nanoid';
import { PdfTeXEngine } from './engines/PdfTeXEngine';
import { XeTeXEngine } from './engines/XeTeXEngine';
import { DvipdfmxEngine } from './engines/DvipdfmxEngine';
import type { BaseEngine, CompileResult } from './engines/BaseEngine';
import { DocumentFile } from '../api/types/document.types';
import { apiClient } from '../api/clients/api-client';
import { API_CONFIG } from '../api/config';

type EngineType = 'pdftex' | 'xetex';

export class LaTeXService {
	private engines: Map<EngineType | 'dvipdfmx', BaseEngine> = new Map();
	private currentEngineType: EngineType = 'pdftex';
	private compilerMode: 'client' | 'server' | 'server_pdflatex' = 'server'; // Defaulting to server as per user request
	private statusListeners: Set<() => void> = new Set();
	private texliveEndpoint = 'https://texlive.texlyre.org'; // Default endpoint from reference

	constructor() {
		this.engines.set('pdftex', new PdfTeXEngine());
		this.engines.set('xetex', new XeTeXEngine());
		this.engines.set('dvipdfmx', new DvipdfmxEngine());
	}

	async initialize(engineType: EngineType = 'pdftex'): Promise<void> {
		this.currentEngineType = engineType;
		const engine = this.engines.get(engineType);
		if (!engine) {
			throw new Error(`Unsupported engine type: ${engineType}`);
		}

		try {
			await engine.initialize();
			engine.setTexliveEndpoint(this.texliveEndpoint);
			this.notifyStatusChange();
		} catch (error) {
			console.error(`Failed to initialize ${engineType} engine:`, error);
			throw error;
		}
	}

	async setEngine(engineType: EngineType): Promise<void> {
		if (this.currentEngineType === engineType) {
			return;
		}
		this.currentEngineType = engineType;
		await this.initialize(engineType);
	}

	setCompilerMode(mode: 'client' | 'server' | 'server_pdflatex'): void {
		this.compilerMode = mode;
		this.notifyStatusChange();
	}

	getCompilerMode(): 'client' | 'server' | 'server_pdflatex' {
		return this.compilerMode;
	}

	getCurrentEngine(): BaseEngine {
		const engine = this.engines.get(this.currentEngineType);
		if (!engine) throw new Error(`Engine ${this.currentEngineType} not found`);
		return engine;
	}

	async compileSingleFile(fileName: string, content: string): Promise<CompileResult> {
		return this.compileWithAssets(fileName, content, []);
	}

	async compileWithAssets(mainFileName: string, content: string, assets: DocumentFile[]): Promise<CompileResult> {
		if (this.compilerMode === 'server' || this.compilerMode === 'server_pdflatex') {
			const engineMode = this.compilerMode === 'server_pdflatex' ? 'pdflatex' : 'tectonic';
			return this.compileOnServer(mainFileName, content, assets, engineMode);
		}

		const engine = this.getCurrentEngine();

		if (!engine.isReady()) {
			await engine.initialize();
		}
		engine.setTexliveEndpoint(this.texliveEndpoint);

		try {
			// 1. Write Assets to MemFS
			console.log(`[LaTeXService] Writing ${assets.length} assets to MemFS...`);
			for (const asset of assets) {
				try {
					const proxyUrl = `${API_CONFIG.baseURL}/upload/download?url=${encodeURIComponent(asset.url)}`;
					console.log(`[LaTeXService] Fetching asset via proxy: ${asset.name} from ${proxyUrl}`);

					const response = await fetch(proxyUrl, {
						mode: 'cors',
						headers: apiClient.getHeaders() as any
					});

					if (!response.ok) {
						throw new Error(`Proxy error! status: ${response.status}`);
					}

					const buffer = await response.arrayBuffer();
					console.log(`[LaTeXService] Asset ${asset.name} loaded, size: ${buffer.byteLength} bytes`);
					const uint8Array = new Uint8Array(buffer);

					// Ensure directory exists if filename contains path
					if (asset.name.includes('/')) {
						const parts = asset.name.split('/');
						parts.pop(); // Remove filename
						let currentPath = '/work';
						for (const part of parts) {
							currentPath += `/${part}`;
							try {
								engine.makeMemFSFolder(currentPath);
							} catch (e) {
								// Folder might already exist
							}
						}
					}

					const memPath = `/work/${asset.name}`;
					engine.writeMemFSFile(memPath, uint8Array);
					console.log(`[LaTeXService] Asset ${asset.name} written to ${memPath}`);
				} catch (assetError: any) {
					console.error(`[LaTeXService] CRITICAL: Failed to load asset ${asset.name}:`, assetError);
					// Throwing here prevents compilation with missing assets which leads to confusing LaTeX errors
					throw new Error(`Failed to load asset "${asset.name}": ${assetError.message}. Please check if the file is accessible.`);
				}
			}

			// 2. Write Main file
			engine.writeMemFSFile(`/work/${mainFileName}`, content);
			engine.setEngineMainFile(mainFileName);

			// 3. Compile
			let result = await engine.compile(mainFileName, []);

			// Handle XDV if using XeTeX
			if (result.status === 0 && !result.pdf && (result as any).xdv) {
				result = await this.processDviToPdf((result as any).xdv, mainFileName, result.log);
			}

			return result;
		} catch (error) {
			console.error('Compilation error:', error);
			throw error;
		}
	}

	private async processDviToPdf(xdvData: Uint8Array, mainFileName: string, originalLog: string): Promise<CompileResult> {
		const dvipdfmxEngine = this.engines.get('dvipdfmx');
		if (!dvipdfmxEngine) throw new Error('DvipdfmxEngine not available');

		if (!dvipdfmxEngine.isReady()) {
			await dvipdfmxEngine.initialize();
		}

		const baseFileName = mainFileName.replace(/\.(tex|ltx)$/i, '');
		const dviFileName = `${baseFileName}.xdv`;

		dvipdfmxEngine.writeMemFSFile(`/work/${dviFileName}`, xdvData);
		dvipdfmxEngine.setEngineMainFile(dviFileName);

		const result = await dvipdfmxEngine.compile(dviFileName, []);

		return {
			pdf: result.pdf,
			status: result.status,
			log: result.status === 0 ? originalLog : `${originalLog}\n\nDvipdfmx error:\n${result.log}`,
		};
	}

	/**
	 * Sends the LaTeX source and asset info to the backend for server-side compilation with Tectonic.
	 */
	private async compileOnServer(mainFileName: string, content: string, assets: DocumentFile[], engine?: 'tectonic' | 'pdflatex'): Promise<CompileResult> {
		try {
			console.log(`[LaTeXService] Compiling on server: ${mainFileName}`);
			
			const response = await fetch(`${API_CONFIG.baseURL}/latex/compile`, {
				method: 'POST',
				headers: {
					...apiClient.getHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content,
					mainFileName,
					assets: assets.map(a => ({
						name: a.name,
						url: a.url
					})),
					engine
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				return {
					log: errorData.log || errorData.error || 'Unknown server error',
					status: errorData.status || response.status,
					pdf: undefined
				};
			}

			const data = await response.json();
			
			// If PDF exists, convert base64 to Uint8Array
			let pdfArrayBuffer: Uint8Array | undefined;
			if (data.pdf) {
				const binaryString = window.atob(data.pdf);
				const bytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				pdfArrayBuffer = bytes;
			}

			return {
				pdf: pdfArrayBuffer,
				log: data.log,
				status: data.status
			};
		} catch (error: any) {
			console.error('[LaTeXService] Server compilation failed:', error);
			throw new Error(`Failed to compile on server: ${error.message}`);
		}
	}

	addStatusListener(listener: () => void): () => void {
		this.statusListeners.add(listener);
		return () => this.statusListeners.delete(listener);
	}

	private notifyStatusChange(): void {
		this.statusListeners.forEach((listener) => listener());
	}
}

export const laTeXService = new LaTeXService();