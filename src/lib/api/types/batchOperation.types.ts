/**
 * Batch Operation Types - Frontend
 * Mirrors backend types for batch operations
 */

export type OperationType = 'save-content' | 'update-metadata' | 'create-checkpoint';

export interface SaveContentPayload {
	content: string;
	contentChecksum?: string;
}

export interface UpdateMetadataPayload {
	title?: string;
	defaultFont?: string;
	defaultFontSize?: string;
	paperSize?: string;
	theme?: string;
}

export interface CreateCheckpointPayload {
	message: string;
	userId: string;
}

export interface BatchOperation {
	operationType: OperationType;
	payload: SaveContentPayload | UpdateMetadataPayload | CreateCheckpointPayload;
}

export interface BatchOperationRequest {
	operations: BatchOperation[];
	transactionId?: string;
}

export interface OperationResult {
	operationType: OperationType;
	success: boolean;
	data?: any;
	error?: string;
	duration: number;
}

export interface BatchOperationResponse {
	transactionId: string;
	documentId: string;
	results: OperationResult[];
	allSucceeded: boolean;
	timestamp: number;
	totalDuration: number;
}
