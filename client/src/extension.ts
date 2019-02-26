/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window, languages, Hover, Uri } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	NotificationType0
} from 'vscode-languageclient';
import { FileController } from './fileController';
import { ProjectController } from './project.controller';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [
			{ scheme: 'file', language: 'html' },
			{ scheme: 'file', language: 'xml' }
		],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	languages.registerHoverProvider('html', {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position);
			const word = document.getText(range);
			return new Hover(`I am a hover of **${word}** !`);
		}
	});

	// Start the client. This will also launch the server
	client.start();
	const fileController = new FileController();

	client.onReady().then(_ => {
		fileController.processAngularFile(projects => {
			client.sendNotification('custom/projects', [projects]);
		});

		fileController.processTranslations(() => {
			client.sendNotification('custom/translationsLoaded');
		});
	});
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
