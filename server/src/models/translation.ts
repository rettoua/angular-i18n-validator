import {
	TextDocument
} from 'vscode-languageserver';


export interface Translation {
	document: TextDocument;
}


// The example settings
export interface ExampleSettings {
	maxNumberOfProblems: number;
}