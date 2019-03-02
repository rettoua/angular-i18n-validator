import { Hover, MarkdownString, Position } from 'vscode';
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

