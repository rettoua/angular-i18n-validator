import { workspace, ExtensionContext, window, languages, Hover, Uri } from 'vscode';

export class FileController {

	public go(): void {
		this.processAngularFile();
		this.processTranslations();
	}

	private processAngularFile(): void {
		workspace.findFiles('**/angular.json', 'node_modules', 1).then(res => {
			if (res.length > 0) {
				workspace.openTextDocument(res[0]);
			}
		});
	}

	private processTranslations(): void {
		workspace.findFiles('**/*.xlf')
			.then(
				files => this.processTranslationFiles(files),
				r => console.log(`cannot find files: ${r.message}`)
			);
	}

	private processTranslationFiles(files: Uri[]): void {
		files.forEach(uri => {
			workspace.openTextDocument(uri).then(d => {
				const r = d;
			});
		});
	}

}