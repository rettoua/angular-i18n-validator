import { Range } from 'vscode-languageserver';
export interface IdRange {
	start: number;
	end: number;
	id: string;
	range: Range;
}
