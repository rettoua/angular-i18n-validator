import { workspace, Uri } from 'vscode';
import { ProjectController } from './project.controller';
import { Project } from './project.model';

export class FileController {

	constructor() { }

	public processAngularFile(callback: (projects: Project[]) => void): void {
		workspace.findFiles('**/angular.json', 'node_modules', 1).then(res => {
			if (res.length > 0) {
				const projects = ProjectController.getProjects(res[0]);
				callback(projects);
			}
		});
	}

	public processTranslations(callback: () => void): void {
		workspace.findFiles('**/*.xlf')
			.then(
				files => {
					this.processTranslationFiles(files, callback);
				},
				r => console.log(`cannot find files: ${r.message}`)
			);
	}

	private processTranslationFiles(files: Uri[], callback: () => void): void {
		files.forEach((uri, index) => {
			const z = index + 1;
			workspace.openTextDocument(uri)
				.then(_ => {
					if (files.length === z) {
						callback();
					}
				});
		});
	}
}