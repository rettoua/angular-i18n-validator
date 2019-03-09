import { Project } from '../project.model';
import { TransUnit } from "./TransUnit";
import { Position } from 'vscode-languageserver';
export interface Translation {
	uri: string;
	documentUri: string;
	units: TransUnit[];
	project: Project;
	insertPosition: Position;
}
