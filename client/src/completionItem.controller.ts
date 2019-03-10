import { Position, CompletionItem, CompletionItemKind } from 'vscode';
import { LanguageClient, TextDocument } from 'vscode-languageclient';

export class CompletionItemController {

	constructor(private client: LanguageClient) { }

	public async getItems(doc: TextDocument, position: Position): Promise<CompletionItem[]> {
		const completionResponse: any[] = await this.client.sendRequest('rettoua.completionItemRequest', {
			url: doc.uri.toString(),
			position: doc.offsetAt(position)
		});
		if (!completionResponse) {
			return [];
		}
		const actions = completionResponse
			.filter(item => !!item)
			.map(item => new CompletionItem(item, CompletionItemKind.Value));
		return actions;
	}
}
