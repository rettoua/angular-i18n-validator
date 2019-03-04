import { workspace, Uri, RelativePattern } from 'vscode';
import { ProjectController } from './project.controller';
import { Project } from './project.model';

export class FileController {
	private projects: Project[] = [];
	private workspaceFolder: Uri;

	constructor() {
		this.workspaceFolder = workspace.workspaceFolders[0].uri;
	}

	public processAngularFile(callback: (projects: Project[]) => void): void {
		workspace.findFiles('**/angular.json', 'node_modules', 1).then(res => {
			if (res.length > 0) {
				this.projects = ProjectController.getProjects(res[0]);
				callback(this.projects);
				this.processHtmlFiles();
			}
		});
	}

	public processHtmlFiles(): void {
		const projectsForSearch = this.projects.map(project => project.root).filter((value, index, self) => self.indexOf(value) === index);
		projectsForSearch.forEach(project => {
			const pattern = new RelativePattern(`${this.workspaceFolder.path}/${project}`, '**/*.html');

			workspace.findFiles(pattern, 'node_modules').then(res => {
				if (res.length > 0) {
					this.doProcessHtmlFile(res, 0);
				}
			});
		});
	}

	public processTranslations(callback: () => void): void {
		workspace.findFiles('**/*.xlf', 'node_modules')
			.then(
				files => {
					this.processTranslationFiles(files, callback);
				},
				r => console.log(`cannot find files: ${r.message}`)
			);
	}

	private processTranslationFiles(files: Uri[], callback: () => void): void {
		let filesLoaded = 0;
		const filesToLoad = files.length;
		files.forEach(uri => {
			workspace.openTextDocument(uri)
				.then(_ => {
					if (++filesLoaded === filesToLoad) {
						callback();
					}
				});
		});
	}

	private doProcessHtmlFile(files: Uri[], indexToProcess: number): void {
		const uri = files[indexToProcess++];
		workspace.openTextDocument(uri).then(_ => {
			const index = indexToProcess;
			setTimeout(() => this.doProcessHtmlFile(files, index), 10);
		});
	}
}