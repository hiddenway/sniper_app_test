import { QueryTypes } from "sequelize";
import { Trade } from "./trade.model";

export default class TradeRepository {
  async createTrade(data: {
    user_id: number;
    buy_id?: number | null;
    input_mint: string;
    output_mint: string;
    side: "buy" | "sell";
    input_amount: string;
    output_amount: string;
    price: string;
    tx_hash: string;
    timestamp: number;
    input_mint_decimals: number;
    output_mint_decimals: number;
    token_name: string | null;
    token_symbol: string | null;
  }) {
    return Trade.create(data);
  }
  async getTradesByUser(userId: number) {
    return await Trade.sequelize!.query(
      `
        SELECT
          t.*,
          EXISTS (
            SELECT 1
            FROM trades s
            WHERE s.buy_id = t.id
          ) AS "isSold"
        FROM trades t
        WHERE t.user_id = :userId
        ORDER BY t.id DESC
      `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );
  }
  async getTrade(userId: number, tradeId: number) {
    return await Trade.findOne({
      where: {
        id: tradeId,
        user_id: userId,
      },
    });
  }
  async isTradeSold(userId: number, tradeId: number) {
    return await Trade.findOne({
      where: {
        buy_id: tradeId,
        user_id: userId,
      },
    });
  }
  async getTradeById(tradeId: number) {
    return await Trade.findOne({
      where: {
        id: tradeId,
      },
    });
  }
}
