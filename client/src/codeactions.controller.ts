import { Range, Selection, CodeAction, Command } from 'vscode';
import { LanguageClient, TextDocument } from 'vscode-languageclient';

export class CodeActionsController {
	constructor(private client: LanguageClient) { }

	public async getActions(doc: TextDocument, range: Range | Selection): Promise<(Command | CodeAction)[]> {
		const codeActionsResponse: any[] = await this.client.sendRequest('rettoua.codeActionsRequest', {
			url: doc.uri.toString(),
			position: doc.offsetAt(range.start)
		});
		if (!codeActionsResponse) {
			return [];
		}
		const actions = codeActionsResponse
			.filter(action => !!action)
			.map(action => {
				return <Command>{
					title: action.title,
					command: RettouaCommands.GENERATE_TRANSLATION,
					arguments: [action.commandArgs]
				};
			});
		return actions;
	}
}
export default class RettouaCommands {
	static GO_TO_FILE = 'rettoua.goto_file';
	static GENERATE_TRANSLATION = 'rettoua.generate_translation';
	static GENERATE_MULTIPLE_TRANSLATIONS = 'rettoua.generate_multiple_translations';
}