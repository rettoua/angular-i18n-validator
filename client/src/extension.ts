import * as path from 'path';
import { workspace, ExtensionContext, commands, languages, window, Uri } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';
import { FileController } from './file.controller';
import { HoverController } from './hover.controller';
import { DefinitionController, ReferenceController } from "./definition.controller";

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
	const definitionController = new DefinitionController(client);
	const referencesController = new ReferenceController(client);
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

	languages.registerDefinitionProvider({ scheme: 'file', language: 'html' }, {
		provideDefinition: definitionController.getDefinition.bind(definitionController)
	});

	languages.registerReferenceProvider({ scheme: 'file', language: 'html' }, {
		provideReferences: referencesController.getReferences.bind(referencesController)
	});

	context.subscriptions.push(commands.registerCommand('rettoua.goto_file', (args) => {
		window.showTextDocument(Uri.parse(args.uri), {
			selection: args.range
		});
	}, this));

}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

