import { nanoid } from 'nanoid';
import { PdfTeXEngine } from './engines/PdfTeXEngine';
import { XeTeXEngine } from './engines/XeTeXEngine';
import { DvipdfmxEngine } from './engines/DvipdfmxEngine';
import type { BaseEngine, CompileResult } from './engines/BaseEngine';

type EngineType = 'pdftex' | 'xetex';

export class LaTeXService {
	private engines: Map<EngineType | 'dvipdfmx', BaseEngine> = new Map();
	private currentEngineType: EngineType = 'pdftex';
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

	getCurrentEngine(): BaseEngine {
		const engine = this.engines.get(this.currentEngineType);
		if (!engine) throw new Error(`Engine ${this.currentEngineType} not found`);
		return engine;
	}

	async compileSingleFile(fileName: string, content: string): Promise<CompileResult> {
		const engine = this.getCurrentEngine();

		if (!engine.isReady()) {
			await engine.initialize();
		}
		engine.setTexliveEndpoint(this.texliveEndpoint);

		try {
			// Write the single file to MemFS
			engine.writeMemFSFile(`/work/${fileName}`, content);
			engine.setEngineMainFile(fileName);

			let result = await engine.compile(fileName, []);

			// Handle XDV if using XeTeX
			if (result.status === 0 && !result.pdf && (result as any).xdv) {
				result = await this.processDviToPdf((result as any).xdv, fileName, result.log);
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

	addStatusListener(listener: () => void): () => void {
		this.statusListeners.add(listener);
		return () => this.statusListeners.delete(listener);
	}

	private notifyStatusChange(): void {
		this.statusListeners.forEach((listener) => listener());
	}
}

export const laTeXService = new LaTeXService();