"use client";

import { useEffect, useState } from "react";
import { AreaChart, Button, Card } from "@tremor/react";

interface Trade {
  txId: string;
  tradeType: string;
  pnlUsd: string;
  feeAmount: string;
  market: string;
  collateralPrice: string;
  price: string;
  collateralAmount: string;
  sizeUsd: string;
  sizeAmount: string;
  positionAddress: string;
  collateralUsd: string;
  timestamp: string;
  side: string;
}

interface Balance {
  date: string;
  PNL: number;
  "Net PNL": number;
}

const MARKETS = {
  "3vHoXbUvGhEHFsLUmxyC6VWsbYDreb1zMn9TAp5ijN5K": {
    name: "SOL",
    denomination: 1_000_000_000,
  },
  "9tvuK63WUV2mgWt7AvWUm7kRUpFKsRX1jewyJ21VTWsM": {
    // short sol
    name: "USDC",
    denomination: 1_000_000,
  },
  GGV4VHTAEyWGyGubXTiQZiPajCEtGv2Ed2G2BHmY3zNZ: {
    name: "BTC",
    denomination: 100_000_000,
  },
  AAHFmCVd4JXXrLFmGBataeCJ6CwrYs4cYMiebXmBFvPE: {
    // short btc
    name: "USDC",
    denomination: 1_000_000,
  },
  "8r5MBC3oULSWdm69yn2q3gBLp6h1AL4Wo11LBzcCZGWJ": {
    name: "ETH",
    denomination: 100_000_000,
  },
  GxkxRPheec7f9ZbamzeWdiHiMbrgyoUV7MFPxXW1387q: {
    // short eth
    name: "USDC",
    denomination: 1_000_000,
  },
  "5QQstJ2LpeHESWqGTWBw5aid8h4cdVUjXU61R84Pj2jr": {
    name: "JUP",
    denomination: 1_000_000,
  },
  Hi8kSmbtzucZpEYxvcq2H1QuyUCRuY3m7WGmTF2RhkVw: {
    // short jup
    name: "USDC",
    denomination: 1_000_000,
  },
  "9V9eYLhVV13VoSfi3McfMcN7ie4WNkRdTbHggkaT8QCQ": {
    name: "PYTH",
    denomination: 1_000_000,
  },
  "2By2fgwfZQetZ56414KBDMZwNBstg3GAJtEePQtf3Aty": {
    // short pyth
    name: "USDC",
    denomination: 1_000_000,
  },
  "7gnDo7scDFYmEnXW2JrGRzCrynmbakoCMqaEo7d2fydG": {
    name: "JTO",
    denomination: 1_000_000_000,
  },
  G7RdCWx4eNfLdagGp4H2tKwhTi9JihBozVLGMVduF1Xe: {
    // short jto
    name: "USDC",
    denomination: 1_000_000,
  },
} as { [key: string]: { name: string; denomination: number } };

let currentPositions = {} as { [key: string]: number };

const dataFormatter = (number: number) =>
  `$${Intl.NumberFormat("us")
    .format(number / 1_000_000)
    .toString()}`;

export default function History({ address }: { address: string }) {
  const [timeframe, setTimeframe] = useState(0); // cutoff time
  const [selectedButton, setSelectedButton] = useState(0);
  const [trades, setTrades] = useState([] as Trade[]);
  const [pnl, setPnl] = useState(0);
  const [fees, setFees] = useState(0);
  const [feesSaved, setFeesSaved] = useState(0);
  const [maxFeeSaved, setMaxFeeSaved] = useState(0);
  const [balanceHistory, setBalanceHistory] = useState([] as Balance[]);

  async function fetchData() {
    const response = await fetch(
      "https://api.prod.flash.trade/trading-history/find-all-by-user-v2/" +
        address
    );
    const data = (await response.json()) as Trade[];

    let balance = 0;
    let balanceAfterFees = 0;
    let balances = [];
    let feeRate = 0;
    let feeSavings = 0;
    let maxFeeSaved = 0;
    let maxFeeDiscount = 0.35;

    for (let i = data.length - 1; i >= 0; i--) {
      const trade = data[i];
      const market = MARKETS[trade.market];

      if (Number.parseInt(trade.timestamp) * 1000 < timeframe) {
        continue;
      }

      if (!market) {
        console.log(trade.market);
        console.log(trade);
        continue;
      }

      if (trade.pnlUsd) {
        balance += Number.parseInt(trade.pnlUsd, 10);
        balanceAfterFees += Number.parseInt(trade.pnlUsd, 10);
      }

      if (trade.tradeType === "OPEN_POSITION") {
        currentPositions[trade.positionAddress] =
          Number.parseInt(trade.collateralUsd) / 1_000_000;
      }

      if (trade.tradeType === "ADD_COLLATERAL") {
        if (trade.side === "long") {
          currentPositions[trade.positionAddress] +=
            ((Number.parseInt(trade.collateralAmount) / market.denomination) *
              Number.parseInt(trade.price)) /
            1_000_000;
        } else {
          currentPositions[trade.positionAddress] -=
            Number.parseInt(trade.collateralAmount) / 1_000_000;
        }
      }

      if (trade.tradeType === "INCREASE_SIZE") {
        if (trade.side === "long") {
          const price =
            Number.parseInt(trade.sizeUsd) /
            1_000_000 /
            (Number.parseInt(trade.sizeAmount) / market.denomination);

          currentPositions[trade.positionAddress] +=
            (Number.parseInt(trade.collateralAmount) / market.denomination) *
            price;
        } else {
          currentPositions[trade.positionAddress] -=
            Number.parseInt(trade.collateralAmount) / 1_000_000;
        }
      }

      if (trade.tradeType === "LIQUIDATE") {
        balance -= currentPositions[trade.positionAddress] * 1_000_000;
        balanceAfterFees -= currentPositions[trade.positionAddress] * 1_000_000;
      }

      if (trade.feeAmount) {
        const price = Number.parseInt(trade.price, 10) / market.denomination;

        let feeUsd = Number.parseInt(trade.feeAmount, 10);

        if (trade.side === "long") {
          feeUsd = Number.parseInt(trade.feeAmount) * price;
        }

        balanceAfterFees -= feeUsd;

        if (trade.tradeType === "OPEN_POSITION") {
          const baseFeeRate =
            Number.parseInt(trade.timestamp) < 1710604140 ? 0.001 : 0.0008;
          maxFeeDiscount =
            Number.parseInt(trade.timestamp) < 1710866700 ? 0.35 : 0.45;

          feeRate =
            (baseFeeRate - feeUsd / Number.parseInt(trade.sizeUsd)) /
            baseFeeRate;
        }

        feeSavings += feeRate * feeUsd;
        maxFeeSaved += maxFeeDiscount * feeUsd;
      }

      balances.push({
        date: trade.timestamp,
        PNL: balance,
        "Net PNL": balanceAfterFees,
      });
    }

    setPnl(balance);
    setFees(balance - balanceAfterFees);
    setFeesSaved(feeSavings);
    setMaxFeeSaved(maxFeeSaved);
    setTrades(data);
    setBalanceHistory(balances);
  }

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  // @ts-ignore
  const customTooltip = (props) => {
    const { payload, active } = props;
    if (!active || !payload) return null;
    return (
      <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
        <p className="text-tremor-content">
          {new Date(payload[0].payload.date * 1000).toLocaleString()}
        </p>
        {/* @ts-ignore */}
        {payload.map((category, idx) => (
          <div key={idx} className="flex flex-1 space-x-2.5">
            <div
              className={`flex w-1 flex-col bg-${category.color}-500 rounded`}
            />
            <div className="space-y-1">
              <p className="text-tremor-content">{category.dataKey}</p>
              <p className="font-medium text-tremor-content-emphasis">
                {(category.value / 1_000_000).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (trades.length === 0) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col items-center max-w-2xl w-full gap-4">
      <div className="flex flex-col w-full max-w-2xl mx-8">
        <h1 className="w-full max-w-2xl font-bold">Trading History</h1>
        <span className="opacity-50">
          {address.slice(0, 4)}...{address.slice(address.length - 4)}
        </span>
      </div>

      <div className="flex gap-4 w-full">
        <Card className="mx-auto grow">
          <h4 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Net Profit
          </h4>
          <p
            className="text-tremor-title sm:text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
            style={{ color: pnl - fees > 0 ? "#15803d" : "#b91c1c" }}
          >
            {((pnl - fees) / 1_000_000).toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}
          </p>
          <p className="text-tremor-default text-xs text-tremor-content dark:text-dark-tremor-content">
            Could have been{" "}
            {(
              (pnl - fees + maxFeeSaved - feesSaved) /
              1_000_000
            ).toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}{" "}
            with a level 6 beast.
          </p>
        </Card>

        <Card className="mx-auto grow flex flex-col justify-center">
          <h4 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Fees Saved
          </h4>
          <p
            className="text-tremor-title sm:text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
            style={{ color: "#15803d" }}
          >
            {(feesSaved / 1_000_000).toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}
          </p>
          <p className="text-tremor-default text-xs text-tremor-content dark:text-dark-tremor-content">
            Could have been{" "}
            {(maxFeeSaved / 1_000_000).toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}{" "}
            with a level 6 beast.
          </p>
        </Card>
      </div>
      <div className="flex gap-4 w-full">
        <Card className="mx-auto grow">
          <h4 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Gross Profit
          </h4>
          <p
            className="text-tremor-title sm:text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
            style={{ color: pnl > 0 ? "#15803d" : "#b91c1c" }}
          >
            {(pnl / 1_000_000).toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}
          </p>
        </Card>

        <Card className="mx-auto grow">
          <h4 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Fees Paid
          </h4>
          <p className="text-tremor-title sm:text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {(fees / 1_000_000).toLocaleString("en-US", {
              currency: "USD",
              style: "currency",
            })}
          </p>
        </Card>

        {/* <Card className="mx-auto grow">
          <h4 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Trade Count
          </h4>
          <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {trades.length}
          </p>
        </Card> */}
      </div>

      <div className="flex gap-2 w-full">
        <Button
          variant={selectedButton === 1 ? "primary" : "secondary"}
          color="green"
          className="grow"
          onClick={() => {
            setTimeframe(new Date().getTime() - 1000 * 60 * 60 * 24);
            setSelectedButton(1);
          }}
        >
          1D
        </Button>
        <Button
          variant={selectedButton === 2 ? "primary" : "secondary"}
          color="green"
          className="grow"
          onClick={() => {
            setTimeframe(new Date().getTime() - 1000 * 60 * 60 * 24 * 7);
            setSelectedButton(2);
          }}
        >
          7D
        </Button>
        <Button
          variant={selectedButton === 3 ? "primary" : "secondary"}
          color="green"
          className="grow"
          onClick={() => {
            setTimeframe(new Date().getTime() - 1000 * 60 * 60 * 24 * 30);
            setSelectedButton(3);
          }}
        >
          30D
        </Button>
        <Button
          variant={selectedButton === 4 ? "primary" : "secondary"}
          color="green"
          className="grow"
          onClick={() => {
            setTimeframe(new Date("2024-01-01").getTime());
            setSelectedButton(4);
          }}
        >
          YTD
        </Button>
        <Button
          variant={selectedButton === 0 ? "primary" : "secondary"}
          color="green"
          className="grow"
          onClick={() => {
            setTimeframe(0);
            setSelectedButton(0);
          }}
        >
          All Time
        </Button>
      </div>

      {balanceHistory.length > 0 && (
        <Card>
          <AreaChart
            className="mt-4 h-48"
            data={balanceHistory}
            index="date"
            valueFormatter={dataFormatter}
            categories={["PNL", "Net PNL"]}
            colors={[
              pnl > 0 ? "green-800" : "red-800",
              pnl - fees > 0 ? "green-500" : "red-500",
            ]}
            customTooltip={customTooltip}
            showAnimation={true}
            animationDuration={500}
          />
        </Card>
      )}
    </div>
  );
}
