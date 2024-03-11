import axios from 'axios';

type TWSEData = {
  n: string; // 名稱
  c: string; // 代號
  ex: string; // 上市: tse 上櫃: otc
  ch: string; // tw 結尾
  y: string; // 昨收
  z: string; // 現價(成交價)
  t: string; // 戳合時間
  o: string; // 開盤價格
  h: string; // 最高價
  l: string; // 最低價
  v: string; // 累積交易量
  u: string; // 漲停價
  w: string; // 跌停價
  tlong: string; // 資料更新時間
};

export default async function twseApi(symbols: string[]) {
  const queryString = symbols.join('|');

  try {
    const res = await axios(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=${queryString}`);
    const data: TWSEData[] = res.data.msgArray;
    
    return data.map(d => {
      const close = Number(d.y);
      const currentPrice = Number(d.z) || -1;
      const trend = getStockTrend(currentPrice, close);
      
      return {
        id: `${d.ex}_${d.ch}`,
        name: d.n,
        symbol: d.c,
        time: d.t,
        open: Number(d.o),
        currentPrice,
        close,
        trend,
        changeRate: getStockChangeRate(currentPrice, close),
        high: Number(d.h),
        low: Number(d.l),
        volume: Number(d.v),
        upperLimit: Number(d.u) || -1,
        lowerLimit: Number(d.w) || -1,
        updatedAt: new Date(parseInt(d.tlong)).toLocaleString('zh-tw')
      };
    });
  } catch (error) {
    console.log(error);
  }
}

function getStockTrend(current: number, close: number) {
  if (current === close) {
    return 'flat';
  } else if (current > close) {
    return 'up';
  } else {
    return 'down';
  }
}

function getStockChangeRate(current: number, close: number) {
  // -1 表示沒有資料
  if (current < 0) {
    return '-';
  }
  
  const difference = current - close;
  
  return ((difference / close) * 100).toFixed(2);
}
