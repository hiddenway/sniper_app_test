import express from "express";
import cors from "cors";
import router from "./modules/trade/trade.controller";
import config from "./config";
import { apiKeyAuth } from "./middleware/auth";

const app = express();

app.use(
  cors({ credentials: true, origin: true, exposedHeaders: "Authorization" })
);
app.options(/.*/, cors({ credentials: true, origin: true }));
app.use(express.json());

app.use(apiKeyAuth);
app.use(router);

app.listen(config.port, () => {
  console.log(`Listening on the port ${config.port}`);
});
