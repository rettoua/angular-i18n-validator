// import { Project } from './project.model';
// import { workspace } from 'vscode';
// import { readJsonSync } from 'fs-extra';

// export class ProjectController {

//     private projects: Project[] = [];

//     identifyProjects(): Thenable<number> {
//         return workspace.findFiles('**/angular.json', 'node_modules', 1).then(res => {
//             if (res.length > 0) {
//                 const ngConfig = readJsonSync(res[0].fsPath);
//                 Object.keys(ngConfig.projects).forEach(project => {

//                     const appConfigPath = this.extractAppConfigPath(ngConfig.projects[project]);
//                     const tstConfigPath = this.extractTestConfigPath(ngConfig.projects[project]);
//                     // if (appConfigPath) {
//                     this.projects.push({
//                         root: this.extractRootPath(ngConfig.projects[project]),
//                         label: project,
//                         exclude: this.extractExcluded(appConfigPath),
//                         include: this.extractIncluded(tstConfigPath),
//                         assets: this.extractDependencies(ngConfig.projects[project]),
//                         picked: false
//                     });
//                     // }
//                 });
//             }
//             return this.projects.length;
//         });
//     }

//     getProjects(): Project[] {
//         return this.projects;
//     }

//     updateProjects(selected: Project[]): { selected: Project[], unselected: Project[] } {
//         this.projects.forEach(p => p.picked = selected.findIndex(s => s.label === p.label) > -1);
//         return { selected: this.projects.filter(p => p.picked), unselected: this.projects.filter(p => !p.picked) };
//     }

//     private extractRootPath(ngConfig: any): string {
//         return ngConfig.root || ngConfig.sourceRoot;
//     }

//     private extractExcluded(configPath: string): string[] {
//         if (!!configPath) {
//             const appSettings = readJsonSync(`${workspace.rootPath}\\${configPath}`);
//             return appSettings.exclude || [];
//         }
//         return [];
//     }

//     private extractIncluded(configPath: string): string[] {
//         if (!!configPath) {
//             const appSettings = readJsonSync(`${workspace.rootPath}\\${configPath}`);
//             return appSettings.include || [];
//         }
//         return [];
//     }

//     private extractAppConfigPath(ngConfig: any): string {
//         return ngConfig.architect.build ? ngConfig.architect.build.options.tsConfig : undefined;
//     }

//     private extractTestConfigPath(ngConfig: any): string {
//         return ngConfig.architect.test ? ngConfig.architect.test.options.tsConfig : undefined;
//     }

//     private extractDependencies(ngConfig: any): string[] {
//         const assets = ngConfig.architect.build && ngConfig.architect.build.options && ngConfig.architect.build.options.assets ? ngConfig.architect.build.options.assets : [];
//         const styles = ngConfig.architect.build && ngConfig.architect.build.options && ngConfig.architect.build.options.styles ? ngConfig.architect.build.options.styles : [];
//         const scripts = ngConfig.architect.build && ngConfig.architect.build.options && ngConfig.architect.build.options.scripts ? ngConfig.architect.build.options.scripts : [];
//         const tsConfig = ngConfig.architect.build && ngConfig.architect.build.options ? [ngConfig.architect.build.options.tsConfig] : [];

//         return [...tsConfig, ...assets, ...styles, ...scripts];
//     }
// }