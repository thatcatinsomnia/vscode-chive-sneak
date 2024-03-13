import * as vscode from 'vscode';
import StockResource from './StockResource';

export type Stock = {
  name: string; // 名稱
  symbol: string; // 代號
  id: string; // 搜尋用字串，ex: tse_2330.tw，直接拿來當 id
  time: string; // 戳合時間
  open: number;  // 開盤價格
  close: number; // 昨日收盤
  high: number; // 最高價
  low: number; // 最低價
  volume: number; // 成交量
  upperLimit: number; // 漲停
  lowerLimit: number; // 跌停
  currentPrice: number; // 現價
  trend: 'up' | 'down' | 'flat' // 當日漲跌
  changeRate: string; // 漲跌比
  updatedAt: string; // 資料時間
};

const REFRESH_TIME = 30 * 1000;
const DEBUG = true;

export default class StockProvider implements vscode.TreeDataProvider<Stock> {
  resource: StockResource;

  private _onDidChangeTreeData: vscode.EventEmitter<Stock[] | undefined | null> = new vscode.EventEmitter<Stock[] | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<Stock[] | undefined | null> = this._onDidChangeTreeData.event;

  constructor(resource: StockResource) {
    this.resource = resource;
    
    if (!DEBUG) {
      setInterval(async () => {
        const stocks = await this.resource.fetchWatchList();
        this._onDidChangeTreeData.fire(stocks);
      }, REFRESH_TIME);
    }
  }
  
  getTreeItem(element: Stock): vscode.TreeItem | Thenable<vscode.TreeItem> {
    const treeItem = this.createTreeItem(element);
    treeItem.contextValue = 'stockItem';
    treeItem.iconPath = new vscode.ThemeIcon('trash');
    treeItem.iconPath = this.createTrendIcon(element);
    treeItem.tooltip = this.createToolTip(element);

    return treeItem;
  }

  getChildren(element?: Stock) {
    return this.resource.fetchWatchList();
  }

  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }

  async addToWatchlist(code = '') {
    if (code.trim().length === 0) {
      return await vscode.window.showErrorMessage("請輸入代號 😐");
    }

    const isExist = await this.resource.checkStockExist(code.trim());

    if (!isExist) {
      return await vscode.window.showErrorMessage(`代號 ${code} 不存在 😦`);
    }

    const config = vscode.workspace.getConfiguration('chiveSneak');
    const watchlist = config.get('watchlist') as string[];

    const formattedSymbol = `tse_${code.trim()}.tw`;

    if (watchlist.includes(formattedSymbol)) {
      return await vscode.window.showErrorMessage(`代號 ${code} 已重複 😢`);
    }

    await config.update('watchlist', [...watchlist, formattedSymbol], vscode.ConfigurationTarget.Global);

    this.refresh();
  }

  createTreeItem(stock: Stock) {
    if (stock.currentPrice === -1) {
      return new vscode.TreeItem(`${stock.name}　-　-`);
    }

    return new vscode.TreeItem(`${stock.name}　${stock.changeRate}%　$${stock.currentPrice}`);
  }

  createTrendIcon(stock: Stock) {
    let icon = null;

    if (stock.currentPrice === -1) {
      icon = new vscode.ThemeIcon(
        'dash',
        new vscode.ThemeColor('stockGray')
      );
    } else if (stock.trend === 'flat') {
      icon = new vscode.ThemeIcon(
        'chrome-minimize',
        new vscode.ThemeColor('stockYellow')
      );
    } else if (stock.trend === 'up') {
      icon = new vscode.ThemeIcon(
        'arrow-small-up',
        new vscode.ThemeColor('stockRed')
      );
    } else {
      icon = new vscode.ThemeIcon(
        'arrow-small-down',
        new vscode.ThemeColor('stockGreen')
      );
    }

    return icon;
  }
  
  createToolTip(stock: Stock) {
    const tooltip = new vscode.MarkdownString();

    const currentPriceString = stock.currentPrice === -1 ? '-' : stock.currentPrice;
    const changeRateString = stock.currentPrice === -1 ? '-' : stock.changeRate + '%';
    const upperLimit = stock.upperLimit === -1 ? '-' : stock.upperLimit;
    const lowerLimit = stock.lowerLimit === -1 ? '-' : stock.lowerLimit;

    tooltip.appendMarkdown(`名稱: ${stock.name}  \n`);
    tooltip.appendMarkdown(`代號: ${stock.symbol}  \n`);
    tooltip.appendMarkdown(`現價: ${currentPriceString}  \n`);
    tooltip.appendMarkdown(`昨收: ${stock.close}  \n`);
    tooltip.appendMarkdown(`漲幅: ${changeRateString}  \n`);
    tooltip.appendMarkdown("---  \n");
    tooltip.appendMarkdown(`開盤: ${stock.open}  \n`);
    tooltip.appendMarkdown(`最高: ${stock.high}  \n`);
    tooltip.appendMarkdown(`最低: ${stock.low}  \n`);
    tooltip.appendMarkdown(`漲停價: ${upperLimit}  \n`);
    tooltip.appendMarkdown(`跌停價: ${lowerLimit}  \n`);
    tooltip.appendMarkdown(`累積成交量: ${stock.volume}  \n`);

    return tooltip;
  }
}
