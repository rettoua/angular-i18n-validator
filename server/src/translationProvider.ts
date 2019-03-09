import { TextDocument, DiagnosticSeverity, Diagnostic, Connection, TextDocuments, Range, WorkspaceEdit } from 'vscode-languageserver';
import { Project } from './project.model';

import matcher = require('matcher');
import normalize = require('normalize-path');
import { TranslationParser } from './translationParser';
import { IdRange, GenerateTranslation, GenerateTranslationCommand } from './models/IdRange';
import { Translation } from './models/Translation';
import { HoverBuilder } from './hoverBuilder';
import { HoverInfo } from './models/HoverInfo';
import { readFileSync } from 'fs';
import { uriToFilePath } from 'vscode-languageserver/lib/files';
import { TransUnitBuilder } from './TransUnitBuilder';

export class TranslationProvider {
	private projects: Project[] = [];
	private translations: Translation[] = [];
	private words = {};

	constructor(private connection: Connection, private documents: TextDocuments) { }

	public assignProjects(projects: Project[]): any {
		this.projects = projects;
		this.assignProjectToTranslation();
	}

	public onTranslationLoaded(): void {
		this.assignProjectToTranslation();
		this.validateHtmlDocuments();
	}

	public onHtmlFilesFound(urls: { fsPath: string, path: string }[]): void {
		urls.forEach(url => {
			const buffer = readFileSync(url.fsPath);
			const content = buffer.toString();
			const doc = TextDocument.create(url.path, 'html', 1, content);
			const wrap = this.getDocument(doc);
			this.doValidate(wrap, false);
		});
	}

	public onGenerateTranslation(args: GenerateTranslationCommand): void {

		const trans = this.translations.find(t => t.uri === args.uri);
		if (trans) {
			const documentUri = trans.documentUri;
			let workspaceEdit = {
				documentChanges:
					[{
						uri: documentUri,
						textDocument: {
							version: null,
							uri: documentUri
						},
						edits: [
							{
								newText: TransUnitBuilder.createTransUnit(args.word, args.source),
								range: {
									start: trans.insertPosition,
									end: trans.insertPosition
								}
							}
						]
					}]
			};
			this.connection.workspace.applyEdit(workspaceEdit);
		}
	}

	public processFile(textDocument: TextDocument): void {
		if (this.isTranslationFile(textDocument)) {
			this.processTranslationFile(this.getDocument(textDocument));
		} else if (this.isHtmlFile(textDocument)) {
			this.processHtmlFile(textDocument);
		}
	}

	public calculateHover(url: string, position: number): any {
		const doc = this.getDocument(url);
		if (doc) {
			const activeWords = <IdRange[]>this.words[doc.url];
			if (activeWords && activeWords.length > 0) {
				const expectedWord = activeWords.find(w => {
					return position >= w.start
						&& position <= w.end;
				});
				if (expectedWord) {
					const trans = this.getSupportedTranslations(doc.url);
					if (trans.length > 0) {
						const values = trans.map(t => {
							const findTrans = t.units.find(u => u.id === expectedWord.id);
							return <HoverInfo>{
								label: t.project.label,
								translation: (findTrans && findTrans.target) || '`no translation`',
								goToCommandArgs: {
									uri: t.uri,
									range: findTrans && findTrans.targetRange
								}
							};
						});
						return HoverBuilder.createPopup(
							expectedWord.range,
							expectedWord.id,
							values);
					}
				}
			}
		}
		return null;
	}

	public calculateLocations(url: string, position: number): any {
		const doc = this.getDocument(url);
		if (doc) {
			const activeWords = <IdRange[]>this.words[doc.url];
			if (activeWords && activeWords.length > 0) {
				const expectedWord = activeWords.find(w => {
					return position >= w.start
						&& position <= w.end;
				});
				if (expectedWord) {
					const trans = this.getSupportedTranslations(doc.url);
					if (trans.length > 0) {
						const locations = trans.map(t => {
							const findTrans = t.units.find(u => u.id === expectedWord.id);
							if (findTrans) {
								return {
									uri: t.uri,
									range: findTrans.targetRange
								};
							}
						});
						return locations;
					}
				}
			}
		}
		return null;
	}

	public calculateReferences(url: string, position: number): any {
		const doc = this.getDocument(url);
		if (doc) {
			const activeWords = <IdRange[]>this.words[doc.url];
			if (activeWords && activeWords.length > 0) {
				const expectedWord = activeWords.find(w => {
					return position >= w.start
						&& position <= w.end;
				});
				if (expectedWord) {
					let refs = <any>[];
					Object.keys(this.words).forEach(key => {
						const fileWords = this.words[key];
						refs = refs.concat(fileWords.filter(word => {
							if (word.id == expectedWord.id) {
								word.url = key;
								return true;
							}
							return false;
						}));
					});

					if (refs.length > 0) {
						return refs.map(ref => <any>{
							url: ref.url,
							range: ref.range
						});
					}
				}
			}
		}
		return null;
	}

	public calculateCodeActions(url: string, position: number): any {
		const doc = this.getDocument(url);
		if (doc) {
			const activeWords = <IdRange[]>this.words[doc.url];
			if (activeWords && activeWords.length > 0) {
				const expectedWord = activeWords.find(w => {
					return position >= w.start
						&& position <= w.end;
				});
				if (expectedWord) {
					const trans = this.getSupportedTranslations(doc.url);
					if (trans.length > 0) {
						let source: string = '';
						let values = trans.map(t => {
							const findTrans = t.units.find(u => u.id === expectedWord.id);
							if (findTrans && findTrans.source) {
								source = findTrans.source;
							}
							if (!findTrans) {
								return <GenerateTranslation>{
									title: `Generate translation unit for ${t.project.label}`,
									commandArgs: {
										word: expectedWord.id,
										uri: t.uri
									}
								};
							}
						});
						values = values.filter(v => !!v).map(value => {
							value.commandArgs.source = source;
							return value;
						});
						return values;
					}
				}
			}
		}
		return null;
	}

	private processHtmlFile(textDocument: TextDocument): void {
		if (!this.projects || Object.keys(this.translations).length === 0) {
			return;
		}
		const wrap = this.getDocument(textDocument);
		this.doValidate(wrap);
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

	private doValidate(wrap: DocumentWrapper, withDiagnistics: boolean = true): void {

		let text = wrap.document.getText();
		let pattern = /i18n.+["|']@@(.+?)["|']/g;
		let m: RegExpExecArray | null;

		const trans = this.getSupportedTranslations(wrap.url);
		if (trans.length === 0) { return; }

		this.words[wrap.url] = [];

		let diagnostics: Diagnostic[] = [];
		while (m = pattern.exec(text)) {
			const group = m[1];
			const value = <IdRange>{
				start: m.index,
				end: m.index + m[0].length,
				id: m[1],
				range: {
					start: wrap.document.positionAt(m.index),
					end: wrap.document.positionAt(m.index + m[0].length)
				}
			};
			this.words[wrap.url].push(value);

			if (!withDiagnistics) { continue; }

			const missingTranslations = trans.filter(t => {
				const unit = t.units.find(u => u.id === group);
				return !unit;
			});

			if (missingTranslations.length === 0) {
				continue;
			}

			const missed = missingTranslations.map(m => m.project.label).join(', ');

			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
				range: {
					start: wrap.document.positionAt(m.index),
					end: wrap.document.positionAt(m.index + m[0].length)
				},
				message: `Missed translation in '${missed}' project(-s)`
			};

			diagnostics.push(diagnostic);
		}

		if (withDiagnistics) {
			this.connection.sendDiagnostics({ uri: wrap.document.uri, diagnostics });
		}
	}

	private processTranslationFile(wrap: DocumentWrapper): void {
		const existTrans = this.translations.find(t => t.uri === wrap.url);
		const parser = new TranslationParser();
		const units = parser.getTransUnits(wrap);
		const indexOfClosingBodyTags = wrap.document.getText().indexOf('</body>');
		const insertPosition = wrap.document.positionAt(indexOfClosingBodyTags);
		if (!existTrans) {
			const proj = this.getProjectForTranslation(wrap.url);
			const trans = <Translation>{
				uri: wrap.url,
				documentUri: wrap.document.uri,
				units: units,
				project: proj,
				insertPosition: insertPosition
			};
			this.translations.push(trans);
		}
		else {
			existTrans.units = units;
			existTrans.insertPosition = insertPosition;
		}
		this.validateHtmlDocuments();
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

	private getSupportedTranslations(url: string): Translation[] {
		const projects = this.projects.filter(p => this.isFileBelongsProject(p, url));
		let trans = [];
		if (projects.length === 0) {
			return trans;
		}
		projects.forEach(p => {
			const selectedTrans = this.translations.find(t => {
				if (!t.project) {
					return false;
				}
				return t.project.label === p.label;
			});
			if (selectedTrans) {
				trans.push(selectedTrans);
			}
		});
		return trans;
	}

	private isFileBelongsProject(project: Project, uri: string): boolean {
		if (uri.indexOf(project.root) < 0) {
			return false;
		}
		const fileShouldBeExcluded = project.exclude.some(e => {
			const matched = matcher.isMatch(uri, e + '*');
			return matched;
		});
		return !fileShouldBeExcluded;
	}

	private getDocument(doc: TextDocument | string): DocumentWrapper {
		let document: TextDocument;
		if (typeof doc === 'string') {
			document = this.documents.get(doc);
		} else {
			document = doc;
		}
		try {
			if (document) {
				return {
					document: document,
					url: normalize(uriToFilePath(document.uri) || document.uri)
				};
			}
		}
		catch (ex) {
			debugger;
		}
		return null;
	}
}

export interface DocumentWrapper {
	document: TextDocument;
	url: string;
}