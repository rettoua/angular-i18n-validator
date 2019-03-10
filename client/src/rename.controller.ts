import { Command, Position, CancellationToken, WorkspaceEdit, Range, Uri } from 'vscode';
import { LanguageClient, TextDocument } from 'vscode-languageclient';
import RettouaCommands from './codeactions.controller';

export class RenameController {

	constructor(private client: LanguageClient) { }

	public async rename(doc: TextDocument, position: Position, newName: string, token: CancellationToken): Promise<WorkspaceEdit> {
		const renameResponse: any[] | string = await this.client.sendRequest('rettoua.renameRequest', {
			url: doc.uri.toString(),
			newName: newName,
			position: doc.offsetAt(position)
		});
		if (typeof renameResponse === 'string') {
			return Promise.reject(renameResponse);
		}
		if (!renameResponse || renameResponse.length === 0) {
			return;
		}

		const edit = new WorkspaceEdit();
		renameResponse
			.filter(action => !!action)
			.forEach(value => {
				edit.replace(Uri.file(value.url), value.range, newName);
			});
		return edit;
	}

	public async prepareRename(document: TextDocument, position: Position, token: CancellationToken): Promise<any> {
		const isRenameAllowed = await this.client.sendRequest('rettoua.isRenameAllowed', {
			url: document.uri.toString(),
			position: document.offsetAt(position)
		});
		if (isRenameAllowed === false) {
			return Promise.reject('You cannot rename this element');
		}
	}
}