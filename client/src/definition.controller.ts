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
		const locations = definitionResponse.map(definition => <Location>{
			uri: Uri.parse(definition.uri),
			range: definition.range
		});
		return locations;
	}
}

export class ReferenceController {
	constructor(private client: LanguageClient) { }

	public async getReferences(doc: TextDocument, pos: Position): Promise<Location[]> {
		const referencesResponse: any[] = await this.client.sendRequest('rettoua.referencesRequest', {
			url: doc.uri.toString(),
			position: doc.offsetAt(pos)
		});
		if (!referencesResponse) {
			return null;
		}
		const locations = referencesResponse.map(definition => <Location>{
			uri: Uri.parse(definition.url),
			range: definition.range
		});
		return locations;
	}
}
