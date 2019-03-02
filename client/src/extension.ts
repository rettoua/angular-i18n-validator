import * as path from 'path';
import { workspace, ExtensionContext, commands, languages, Hover, MarkdownString, Position, window, Range, Uri } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	TextDocument
} from 'vscode-languageclient';
import { FileController } from './file.controller';
import { HoverResponse } from './models/HoverResponse';
import { HoverRequest } from './models/HoverRequest';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ scheme: 'file', language: 'html' },
			{ scheme: 'file', language: 'xml' }
		],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		},

	};

	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	client.start();
	const fileController = new FileController();
	const hoverController = new HoverController(client);
	client.onReady().then(_ => {
		fileController.processAngularFile(projects => {
			client.sendNotification('custom/projects', [projects]);
		});

		fileController.processTranslations(() => {
			client.sendNotification('custom/translationsLoaded');
		});
	});

	languages.registerHoverProvider({ scheme: 'file', language: 'html' }, {
		provideHover: hoverController.getHover.bind(hoverController)
	});

	context.subscriptions.push(commands.registerCommand('rettoua.goto_file', (args) => {
		// workspace.openTextDocument(args.uri).then(document => {

		// });
		window.showTextDocument(Uri.parse(args.uri), {
			selection: args.range
		}).then(editor => {
			// editor.show();
		}, error => {
			debugger;
		});
	}, this));

}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

export class HoverController {

	constructor(private client: LanguageClient) { }

	public async getHover(doc: TextDocument, pos: Position): Promise<Hover> {
		const hoverResponse: HoverResponse = await this.client.sendRequest('rettoua.request', <HoverRequest>{
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