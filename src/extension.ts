import * as vscode from 'vscode';
import StockResource from './StockResource';
import StockProvider from './StockProvider';

export function activate(context: vscode.ExtensionContext) {
	const stockResource = new StockResource();
	const stockProvider = new StockProvider(stockResource);
	vscode.window.registerTreeDataProvider('chiveSneak', stockProvider);
}

export function deactivate() {}
