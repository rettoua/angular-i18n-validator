import { CommandArgs } from "./CommandArgs";
export interface HoverInfo {
	label: string;
	translation: string;
	goToCommandArgs: CommandArgs<{}>;
}
