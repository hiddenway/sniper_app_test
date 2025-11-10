import { Request, Response, Router } from "express";
import TradeSevice from "./trade.service";
import BlockchainClient from "./blockchain.client";
import TradeRepository from "./trade.repository";
import config from "../../config";
import Joi from "joi";
import { camelToSnake } from "../../utils/case";
import { AppError } from "../../errors/app-error";

const router = Router();

const tradeService = new TradeSevice(
  new BlockchainClient(config.solanaRpc, config.signerPK),
  new TradeRepository()
);

router.post("/buy", async (req: Request, res: Response) => {
  try {
    const { error, value } = Joi.object({
      user_id: Joi.number().integer().positive().required(),
      token_mint: Joi.string().trim().min(1).max(64).required(),
      amount: Joi.string().trim().min(1).max(64).required(),
    }).validate(req.body);

    if (error) return onError(res, 400, error.details[0].message);

    const result = await tradeService.methodBuy(
      value.user_id,
      value.token_mint,
      value.amount
    );

    return res.json(camelToSnake({ success: true, result }));
  } catch (e) {
    return handleError(res, e);
  }
});

router.post("/sell", async (req: Request, res: Response) => {
  try {
    const { error, value } = Joi.object({
      user_id: Joi.number().integer().positive().required(),
      trade_id: Joi.number().integer().positive().required(),
    }).validate(req.body);

    if (error) return onError(res, 400, error.details[0].message);

    const result = await tradeService.methodSell(value.user_id, value.trade_id);

    return res.json(camelToSnake({ success: true, result }));
  } catch (e) {
    return handleError(res, e);
  }
});

router.get("/pnl/:userId", async (req: Request, res: Response) => {
  try {
    const { error, value } = Joi.number()
      .integer()
      .positive()
      .required()
      .validate(req.params.userId);

    if (error) return onError(res, 400, error.details[0].message);

    const result = await tradeService.getPNL(value);

    return res.json(camelToSnake({ success: true, result }));
  } catch (e) {
    return handleError(res, e);
  }
});

function onError(res: Response, statusCode: number, errorDescription: string) {
  res.status(statusCode).send({ success: false, errorDescription });
}

function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return onError(res, error.statusCode, error.message);
  }

  console.error("Unhandled trade error", error);
  return onError(res, 500, "Internal server error. Message: " + error);
}

export default router;
