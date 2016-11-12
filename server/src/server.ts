'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

let { exec, execNode } = require('sb-exec');

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
		}
	};
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// The settings interface describes the server relevant settings
interface Settings {
	languageServerCredo: CredoSettings;
}

// defined in the client's package.json
interface CredoSettings {
	flags: string;
	executablePath: string;
}

let flags: string;
let executablePath: string;
// The settings have changed. Also sent on server activation.
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	flags = settings.languageServerCredo.flags || '';
	executablePath = settings.languageServerCredo.executablePath || 'mix';
	// Revalidate any open text documents
	documents.all().forEach(validateTextDocument);
});

function parseOutput(output) {
	if (!!output.stderr || !output.stdout) {
    return [];
  }
	return output.stdout.split('\n').map(error => {
		let matches = error.match(/^.*?:(\d+):?(\d+)?:\s(.*)/);
		if (!matches[1]) return null;
		let line = parseInt(matches[1]) - 1;
		let col = parseInt(matches[2]) - 1;
		return {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: { line, character: isNaN(col) ? 0 : col },
				end: { line, character: isNaN(col) ? Number.MAX_VALUE : col }
			},
			message: matches[3],
			source: 'credo'
		};
	});
}

function validateTextDocument(textDocument: TextDocument): void {
	// Execute the linter in a Node child process
	let args = ['credo'].concat(flags.split(' ')).concat(['--read-from-stdin', '--format=flycheck']);
	exec(executablePath, args, {
		cwd: workspaceRoot,
		stdin: textDocument.getText(),
		stream: 'both'
	}).then(result => connection.sendDiagnostics({
		uri: textDocument.uri,
		diagnostics: parseOutput(result)
	})).catch(err => connection.console.error(err));
}

// connection.onDidChangeWatchedFiles((change) => {
// 	// Monitored files have change in VSCode
// 	connection.console.log('We recevied an file change event');
// });

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();
