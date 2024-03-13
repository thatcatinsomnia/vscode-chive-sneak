import type { Stock } from './StockProvider';
import * as vscode from 'vscode';
import { twseApi, checkTwStockExistByCode } from "./twseApi";

export default class StockResource {
  async fetchWatchList() {
    const watchlist = await this.getUserWatchListOrDefault();
    const stocks = await twseApi(watchlist);
    return stocks as Stock[];
  }

  async checkStockExist(code = '') {
    return await checkTwStockExistByCode(code);
  }

  async getUserWatchListOrDefault() {
    const config = vscode.workspace.getConfiguration('chiveSneak');
    let watchlist = config.get('watchlist');

    if (!watchlist) {
      // 大盤為預設資料
      watchlist = ['tse_t00.tw'];
      await config.update('watchlist', watchlist, vscode.ConfigurationTarget.Global);
    }

    return watchlist as string[];
  }
}
