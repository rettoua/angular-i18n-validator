import { TextDocument, DiagnosticSeverity, Diagnostic, Connection } from 'vscode-languageserver';
import { Translation } from './models/Translation';

export class TranslationProvider {
	private translations = new Array<Translation>();
	
	constructor(private connection: Connection) { }

	public processFile(textDocument: TextDocument): void {
		if (this.isTranslationFile(textDocument)) {

		} else if (this.isAngularJsonFile(textDocument)) {

		}
	}

	public async validate(textDocument: TextDocument): Promise<void> {
		this.doValidate(textDocument);
	}

	private isTranslationFile(textDocument: TextDocument): boolean {
		return textDocument.languageId === 'xliff';
	}

	private isAngularJsonFile(textDocument: TextDocument): boolean {
		return textDocument.uri.toLocaleLowerCase().endsWith('angular.json');
	}

	private processAngularFile(textDocument: TextDocument): void {

	}

	private doValidate(textDocument: TextDocument): void {
		// The validator creates diagnostics for all uppercase words length 2 and more
		let text = textDocument.getText();
		let pattern = /i18n.+["|']@@?(.+)["|']/g;
		let m: RegExpExecArray | null;

		let problems = 0;
		let diagnostics: Diagnostic[] = [];
		while (m = pattern.exec(text)) {
			problems++;
			const group = m[0];
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
				range: {
					start: textDocument.positionAt(m.index),
					end: textDocument.positionAt(m.index + m[0].length)
				},
				message: `Missing translations found for ${m[1]}`
			};

			diagnostics.push(diagnostic);
		}

		// Send the computed diagnostics to VSCode.
		this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}
}