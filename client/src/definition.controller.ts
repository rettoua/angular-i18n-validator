import { Position, Location, Uri } from 'vscode';
import { LanguageClient, TextDocument } from 'vscode-languageclient';

export class DefinitionController {
	constructor(private client: LanguageClient) { }

	public async getDefinition(doc: TextDocument, pos: Position): Promise<Location[]> {
		const definitionResponse: any[] = await this.client.sendRequest('rettoua.locationsRequest', {
			url: doc.uri.toString(),
			position: doc.offsetAt(pos)
		});
		if (!definitionResponse) {
			return null;
		}
		const locations = definitionResponse
			.filter(definition => !!definition)
			.map(definition => <Location>{
				uri: Uri.file(definition.uri),
				range: definition.range
			});
		return locations;
	}
}

