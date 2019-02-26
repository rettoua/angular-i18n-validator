import { TextDocument, DiagnosticSeverity, Diagnostic, Connection, TextDocuments } from 'vscode-languageserver';
import { Project, ProjectTranslation } from './project.model';

export class TranslationProvider {
	private projects: Project[] = [];
	private translations: Translation[] = [];

	constructor(private connection: Connection, private documents: TextDocuments) { }

	public assignProjects(projects: Project[]): any {
		this.projects = projects;
		this.assignProjectToTranslation();
	}

	public onTranslationLoaded(): void {
		this.assignProjectToTranslation();
		this.validateHtmlDocuments();
	}

	public processFile(textDocument: TextDocument): void {
		if (this.isTranslationFile(textDocument)) {
			this.processTranslationFile(textDocument);
		} else if (this.isHtmlFile(textDocument)) {
			this.processHtmlFile(textDocument);
		}
	}

	private processHtmlFile(textDocument: TextDocument): void {
		if (!this.projects || Object.keys(this.translations).length === 0) {
			return;
		}
		this.doValidate(textDocument);
	}

	private validateHtmlDocuments(): void {
		this.documents.all().forEach(textDocument => {
			if (this.isHtmlFile(textDocument)) {
				this.processHtmlFile(textDocument);
			}
		});
	}

	private isTranslationFile(textDocument: TextDocument): boolean {
		return textDocument.languageId === 'xml' &&
			textDocument.uri.endsWith('.xlf');
	}

	private isHtmlFile(textDocument: TextDocument): boolean {
		return textDocument.languageId === 'html';
	}

	private doValidate(textDocument: TextDocument): void {
		// The validator creates diagnostics for all uppercase words length 2 and more
		let text = textDocument.getText();
		let pattern = /i18n.+["|']@@(.+?)["|']/g;
		let m: RegExpExecArray | null;

		let diagnostics: Diagnostic[] = [];
		while (m = pattern.exec(text)) {
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

	private processTranslationFile(textDocument: TextDocument): void {
		const parser = new TranslationParser();
		const units = parser.getTransUnits(textDocument);
		const proj = this.getProjectForTranslation(textDocument.uri);
		const trans = <Translation>{
			uri: textDocument.uri,
			units: units,
			project: proj
		};
		this.translations.push(trans);
		this.processHtmlFile(textDocument);
	}

	private getProjectForTranslation(uri: string): Project {
		if (!this.projects) {
			return null;
		}
		const proj = this.projects.find(p => {
			if (uri.indexOf(p.translation.i18nFile) >= 0) {
				return true;
			}
		});
		return proj;
	}

	private assignProjectToTranslation(): void {
		if (this.translations.length === 0 || this.projects.length === 0) {
			return;
		}
		this.translations.forEach(trans => {
			const proj = this.getProjectForTranslation(trans.uri);
			trans.project = proj;
		});
	}

	// private getSupportedTranslationFiles(textDocument: TextDocument): ProjectTranslation[] {

	// }
}

export class TranslationParser {
	private splitUnitsRegex = /<trans-unit(.|\s|\n)*?<\/trans-unit>/gm;
	private idRegex = /id=["|'](.+?)["|']/m;
	private sourceRegex = /<source>((.|\s|\n)*?)<\/source>/m;
	private targetRegex = /<target>((.|\s|\n)*?)<\/target>/m;

	public getTransUnits(document: TextDocument): TransUnit[] {
		try {
			let unitBlocks = this.getTransUnitsBlocks(document);
			let units = this.processUnitBlocks(unitBlocks);
			return units;
		}
		catch (ex) {
			console.log(ex.message);
		}

		return [];
	}

	private getTransUnitsBlocks(document: TextDocument): RegExpExecArray[] {
		let units = [];

		let m: RegExpExecArray | null;
		const text = document.getText();
		while (m = this.splitUnitsRegex.exec(text)) {
			units.push(m);
		}
		return units;
	}

	private processUnitBlocks(blocks: RegExpExecArray[]): TransUnit[] {
		let units: TransUnit[] = [];
		blocks.forEach(value => {
			const text = value[0];
			const id = this.idRegex.exec(text);
			if (!id) {
				return;
			}
			const source = this.sourceRegex.exec(text);
			const target = this.targetRegex.exec(text);
			units.push(<TransUnit>{
				id: id[1],
				source: source && source[1],
				target: target && target[1],
				sourceIndex: source && source.index,
				targetIndex: target && target.index
			});
		});
		return units;
	}
}

export interface TransUnit {
	id: string;
	source: string;
	target: string;
	sourceIndex: number;
	targetIndex: number;
}

export interface Translation {
	uri: string;
	units: TransUnit[];
	project: Project;
}