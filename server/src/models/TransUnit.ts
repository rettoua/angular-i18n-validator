import { Range } from 'vscode-languageserver';

export interface TransUnit {
	id: string;
	source: string;
	target: string;
	sourceIndex: number;
	targetIndex: number;
	targetRange: Range;
}
