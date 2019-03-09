import * as path from 'path';
import { workspace, ExtensionContext, commands, languages, window, Uri, WorkspaceEdit } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	TextDocument
} from 'vscode-languageclient';
import { FileController } from './file.controller';
import { HoverController } from './hover.controller';
import { DefinitionController } from "./definition.controller";
import { ReferenceController } from "./reference.controller";
import RettouaCommands, { CodeActionsController } from './codeactions.controller';

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
	const codeActionsController = new CodeActionsController(client);

	client.onReady().then(_ => {

		fileController.processAngularFile(projects => {
			client.sendNotification('custom/projects', [projects]);

			fileController.processTranslations(() => {
				client.sendNotification('custom/translationsLoaded');

				fileController.processHtmlFiles(projects, (urls: any[]) => {
					client.sendNotification('custom/htmlFiles', [urls]);
				});
			});
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

	languages.registerCodeActionsProvider({ scheme: 'file', language: 'html' }, {
		provideCodeActions: codeActionsController.getActions.bind(codeActionsController)
	});

	// languages.registerRenameProvider({ scheme: 'file', language: 'html' }, {
	// 	provideRenameEdits: ()
	// });

	context.subscriptions.push(commands.registerCommand(RettouaCommands.GO_TO_FILE, (args) => {
		window.showTextDocument(Uri.file(args.uri), {
			selection: args.range
		});
	}, this));

	context.subscriptions.push(commands.registerCommand(RettouaCommands.GENERATE_TRANSLATION, (args) => {
		client.sendNotification('custom/generate_translations', [args]);
	}, this));
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

