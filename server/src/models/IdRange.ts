import { Range } from 'vscode-languageserver';
export interface IdRange {
	start: number;
	end: number;
	id: string;
	idStart: number;
	range: Range;
	idRange: Range;
}

export interface GenerateTranslation {
	title: string;
	commandArgs: GenerateTranslationCommand[];
}

export interface GenerateTranslationCommand {
	word: string;
	uri: string;
	source?: string;
}