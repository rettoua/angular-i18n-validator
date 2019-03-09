import { Location, Uri, Range, Selection, CodeActionContext, CancellationToken, CodeAction, ProviderResult, Command } from 'vscode';
import { LanguageClient, TextDocument } from 'vscode-languageclient';

export class CodeActionsController {
	constructor(private client: LanguageClient) { }

	public async getActions(doc: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): Promise<(Command | CodeAction)[]> {
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
				const path = Uri.file(action.commandArgs.uri);
				// const path1 = pathtou action.commandArgs.uri);
				return <Command>{
					title: action.title,
					command: RettouaCommands.GENERATE_TRANSLATION,
					arguments: [{
						...action.commandArgs,
						// uri: Uri.file(action.commandArgs.uri).path,
					}]
				}
			});
		return actions;
	}
}

export default class RettouaCommands {
	static GO_TO_FILE = 'rettoua.goto_file';
	static GENERATE_TRANSLATION = 'rettoua.generate_translation';
	static GENERATE_MULTIPLE_TRANSLATIONS = 'rettoua.generate_multiple_translations';
}