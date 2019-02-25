import { Project, ProjectTranslation } from './project.model';
import { readJsonSync } from 'fs-extra';
import { workspace, Uri } from 'vscode';

export class ProjectController {

	static getProjects(uri: Uri): Project[] {
		const controller = new ProjectController();
		return controller.identifyProjects(uri);
	}

	identifyProjects(uri: Uri): Project[] {
		let projects: Project[] = [];
		const ngConfig = readJsonSync(uri.fsPath);
		Object.keys(ngConfig.projects).forEach(project => {

			const appConfigPath = this.extractAppConfigPath(ngConfig.projects[project]);
			if (appConfigPath) {
				try {
					projects.push({
						root: this.extractRootPath(ngConfig.projects[project]),
						label: project,
						exclude: this.extractExcluded(appConfigPath),
						translation: this.extractTranslationFile(ngConfig.projects[project])
					});
				}
				catch  { }
			}
		});
		return projects;
	}

	private extractRootPath(ngConfig: any): string {
		return ngConfig.root || ngConfig.sourceRoot;
	}

	private extractExcluded(configPath: string): string[] {
		if (!!configPath) {
			const appSettings = readJsonSync(`${workspace.rootPath}\\${configPath}`);
			return appSettings.exclude || [];
		}
		return [];
	}

	private extractTranslationFile(ngConfig: any): ProjectTranslation {
		let translation: ProjectTranslation = null;
		const configurations = ngConfig.architect.build.configurations;
		Object.keys(configurations).forEach(key => {
			const config = configurations[key];
			if (config['i18nFile'] !== undefined) {
				translation = {
					i18nFile: config.i18nFile,
					i18nFormat: config.i18nFormat,
					i18nLocale: config.i18nLocale
				};
				return false;
			}
		});
		return translation;
	}

	private extractAppConfigPath(ngConfig: any): string {
		return ngConfig.architect.build ? ngConfig.architect.build.options.tsConfig : undefined;
	}
}