// database/sequelize.ts
import { Sequelize } from "sequelize";
import config from "./config";

const database = new Sequelize({
  dialect: "sqlite",
  storage: config.dbPath,
  logging: false,
});

;(async () => {
  await database.sync();
})();

export default database;
