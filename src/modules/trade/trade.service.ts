import type BlockchainClient from "./blockchain.client";
import config from "../../config";
import type TradeRepository from "./trade.repository";
import BN from "bn.js";
import { ConflictError, NotFoundError } from "../../errors/app-error";

export default class TradeService {
  constructor(
    private blockchainClient: BlockchainClient,
    private tradeRepository: TradeRepository
  ) {}

  async methodBuy(userId: number, tokenMint: string, amount: string) {
    const inputMint = config.inputMintForSimple;
    const outputMint = tokenMint;

    const swapResult = await this.blockchainClient.swap(
      inputMint,
      outputMint,
      new BN(amount)
    );

    const tokenInfoInput = await this.blockchainClient.getTokenInfo(inputMint);
    const tokenInfoOutput = await this.blockchainClient.getTokenInfo(outputMint);

    const inputAmount = this.blockchainClient.convertBNToAmount(
      new BN(swapResult.executeResponse.inputAmountResult),
      tokenInfoInput.decimals
    );

    const outputAmount = this.blockchainClient.convertBNToAmount(
      new BN(swapResult.executeResponse.outputAmountResult),
      tokenInfoOutput.decimals
    );

    const price = inputAmount / outputAmount;

    const createTradeResult = await this.tradeRepository.createTrade({
      user_id: userId,
      input_mint: inputMint,
      output_mint: outputMint,
      side: "buy",
      input_amount: swapResult.executeResponse.inputAmountResult,
      output_amount: swapResult.executeResponse.outputAmountResult,
      price: price.toString(),
      tx_hash: swapResult.executeResponse.signature,
      timestamp: Math.floor(Date.now() / 1000),
      input_mint_decimals: tokenInfoInput.decimals,
      output_mint_decimals: tokenInfoOutput.decimals,
      token_name: tokenInfoOutput.name,
      token_symbol: tokenInfoOutput.symbol,
    });

    return {
      swapResult,
      tradeId: createTradeResult.id,
    };
  }

  async methodSell(userId: number, tradeId: number) {
    const trade = await this.tradeRepository.getTrade(userId, tradeId);

    if (!trade) {
      throw new NotFoundError("Trade not found");
    }

    const isTradeSold = await this.tradeRepository.isTradeSold(userId, tradeId);

    if (isTradeSold) {
      throw new ConflictError("Trade already sold");
    }

    const inputMint = trade.output_mint;
    const outputMint = trade.input_mint;

    const swapResult = await this.blockchainClient.swap(
      inputMint,
      outputMint,
      new BN(trade.output_amount)
    );

    const inputAmount = this.blockchainClient.convertBNToAmount(
      new BN(swapResult.executeResponse.inputAmountResult),
      trade.input_mint_decimals
    );
    const outputAmount = this.blockchainClient.convertBNToAmount(
      new BN(swapResult.executeResponse.outputAmountResult),
      trade.output_mint_decimals
    );

    const price = inputAmount / outputAmount;

    await this.tradeRepository.createTrade({
      user_id: userId,
      buy_id: trade.id,
      input_mint: inputMint,
      output_mint: outputMint,
      side: "sell",
      input_amount: swapResult.executeResponse.inputAmountResult,
      output_amount: swapResult.executeResponse.outputAmountResult,
      price: price.toString(),
      tx_hash: swapResult.executeResponse.signature,
      timestamp: Math.floor(Date.now() / 1000),
      input_mint_decimals: trade.input_mint_decimals,
      output_mint_decimals: trade.output_mint_decimals,
      token_name: trade.token_name,
      token_symbol: trade.token_symbol,
    });

    return {
      swapResult,
      tradeId: trade.id,
    };
  }

  async getPNL(userId: number) {
    const trades: any[] = await this.tradeRepository.getTradesByUser(userId);
    const result: Record<string, any> = {};

    if (trades.length === 0) {
      throw new NotFoundError("No trades found for this user");
    }

    for (const trade of trades) {
      const tokenMint =
        trade.side === "buy"
          ? trade.output_mint.toString()
          : trade.input_mint.toString();

      const tokenMintId = tokenMint.toLocaleLowerCase();

      if (!result[tokenMintId]) {
        result[tokenMintId] = {
          token: tokenMint,
          bought: 0,
          sold: 0,
          name: null,
          symbol: null,
        };
      }

      if (trade.side === "buy") {
        const decimals = trade.input_mint_decimals;

        const amountRaw = this.blockchainClient.convertBNToAmount(
          new BN(trade.input_amount),
          decimals
        );

        result[tokenMintId].name = trade.token_name;
        result[tokenMintId].symbol = trade.token_symbol;

        if (!trade.isSold) {
          const order = await this.blockchainClient.getOrder(
            trade.output_mint.toString(),
            trade.input_mint.toString(),
            new BN(trade.output_amount)
          );

          const rawSold = this.blockchainClient.convertBNToAmount(
            new BN(order.outAmount),
            decimals
          );

          result[tokenMintId].sold += rawSold;
        }

        result[tokenMintId].bought += amountRaw;
      } else {
        const decimals = trade.input_mint_decimals;

        const amountRaw = this.blockchainClient.convertBNToAmount(
          new BN(trade.output_amount),
          decimals
        );

        result[tokenMintId].sold += amountRaw;
      }
    }

    let totalPnl = 0;

    for (const token of Object.values(result) as any[]) {
      token.bought = token.bought.toFixed(9);
      token.sold = token.sold.toFixed(9);
      token.pnl = (token.sold - token.bought).toFixed(9);

      totalPnl += Number(token.pnl);
    }

    result.totalPnl = totalPnl.toFixed(9);

    return result;
  }
}
