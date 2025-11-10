import express from "express";
import cors from "cors";
import router from "./modules/trade/trade.controller";
import config from "./config";

const app = express();

app.use(
  cors({ credentials: true, origin: true, exposedHeaders: "Authorization" })
);
app.options(/.*/, cors({ credentials: true, origin: true }));
app.use(express.json());

app.use(router);

app.listen(config.port, () => {
  console.log(`Listening on the port ${config.port}`);
});
