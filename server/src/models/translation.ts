import { Project } from '../project.model';
import { TransUnit } from "./TransUnit";
export interface Translation {
	uri: string;
	units: TransUnit[];
	project: Project;
}
