import path from "path";
import "dotenv/config";

export const config = {
  solanaRpc: process.env.SOLANA_RPC ?? "https://api.mainnet-beta.solana.com",
  port: Number(process.env.PORT ?? 5600),
  dbPath:
    process.env.DB_PATH ?? path.resolve(__dirname, "../data/database.sqlite"),
  signerPK: process.env.SIGNER_PK ?? "",
  inputMintForSimple: process.env.INPUT_MINT_FOR_SIMPLE_MODE ?? "",
};

if (config.signerPK == "") {
  throw new Error("[Config] SIGNER_PK is not set");
}

if (!config.inputMintForSimple) {
  throw new Error("[Config] INPUT_MINT is not set");
}

export default config;
