import { Hover, MarkdownString, Position, Location, Uri } from 'vscode';
import { LanguageClient, TextDocument } from 'vscode-languageclient';
import { HoverResponse } from './models/HoverResponse';
import { HoverRequest } from './models/HoverRequest';

export class HoverController {
	constructor(private client: LanguageClient) { }

	public async getHover(doc: TextDocument, pos: Position): Promise<Hover> {
		const hoverResponse: HoverResponse = await this.client.sendRequest('rettoua.hoverRequest', <HoverRequest>{
			url: doc.uri.toString(),
			position: doc.offsetAt(pos)
		});
		if (!hoverResponse) {
			return null;
		}
		return new Hover(<MarkdownString>{
			value: hoverResponse.contents,
			isTrusted: true
		}, hoverResponse.range);
	}
}
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
