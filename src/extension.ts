import * as vscode from 'vscode';
import StockResource from './StockResource';
import StockProvider from './StockProvider';

export function activate(context: vscode.ExtensionContext) {
	const stockResource = new StockResource();
	const stockProvider = new StockProvider(stockResource);
	vscode.window.registerTreeDataProvider('chiveSneak', stockProvider);

	const add = vscode.commands.registerCommand('chiveSneak.add', async () => {
		const code = await vscode.window.showInputBox({
			prompt: '請輸入標的代號，例如: 0050',
			placeHolder: 'Add new stock symbol'
		});

		stockProvider.addToWatchlist(code);
	});

	context.subscriptions.push(add);
}

export function deactivate() {}
