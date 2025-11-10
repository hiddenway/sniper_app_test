import {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
  ParsedAccountData,
} from "@solana/web3.js";
import bs58 from "bs58";
import BN from "bn.js";

export default class BlockchainClient {
  private decimalsCache = new Map<string, number>();
  jupOrderApi: string;
  jupExecuteApi: string;
  jupTokenInfoApi: string;
  signer: Keypair;
  skipPreFlight: boolean;
  connection: Connection;

  constructor(solanaRpc: string, singerPK: string) {
    this.jupOrderApi = "https://lite-api.jup.ag/ultra/v1/order";
    this.jupExecuteApi = "https://lite-api.jup.ag/ultra/v1/execute";
    this.jupTokenInfoApi = "https://lite-api.jup.ag/ultra/v1/search";

    this.signer = Keypair.fromSecretKey(bs58.decode(singerPK));
    this.skipPreFlight = false;

    this.connection = new Connection(solanaRpc, {
      commitment: "confirmed",
    });
  }

  async swap(inputMint: string, outputMint: string, amount: BN) {
    const getOrderResponse = await this.getOrder(
      inputMint,
      outputMint,
      amount,
      this.signer.publicKey.toBase58()
    );

    const swapTransactionBase64 = Buffer.from(
      getOrderResponse.transaction,
      "base64"
    );

    const transaction = VersionedTransaction.deserialize(swapTransactionBase64);

    transaction.sign([this.signer]);

    // const sendTransactionSignature = await this.connection.sendTransaction(
    //   transaction,
    //   {
    //     skipPreflight: this.skipPreFlight,
    //   }
    // );

    const executeResponse = await this.executeOrder(
      Buffer.from(transaction.serialize()).toString("base64"),
      getOrderResponse.requestId
    );

    const swapReturn = {
      executeResponse,
      orderResponse: getOrderResponse,
    };

    return swapReturn;
  }

  async getOrder(
    inputMint: string,
    outputMint: string,
    amount: BN,
    taker: string | null = null
  ) {
    let url =
      `${this.jupOrderApi}` +
      `?inputMint=${inputMint}` +
      `&outputMint=${outputMint}` +
      `&amount=${amount}` +
      `&taker=${taker}`;

    if (taker == null) {
      url = `${this.jupOrderApi}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `${response.status} ${response.statusText}. Body: ${errorBody}`
      );
    }

    const quoteResponse = await response.json();

    if (quoteResponse.error) {
      throw new Error(quoteResponse.error);
    }

    return quoteResponse;
  }

  async getTokenInfo(tokenMint: string) {
    const url = `${this.jupTokenInfoApi}?query=${tokenMint}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `getTokenInfo error: ${response.status} ${response.statusText}. Body: ${errorBody}`
      );
    }

    const quoteResponse = await response.json();

    return quoteResponse[0];
  }

  private async executeOrder(signedTransaction: string, requestId: string) {
    try {
      const response = await fetch(this.jupExecuteApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          signedTransaction,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `getOrder error: ${response.status} ${response.statusText}. Body: ${errorBody}`
        );
      }

      const quoteResponse = await response.json();

      return quoteResponse;
    } catch (e: any) {
      if (e.cause) console.error("getOrder cause:", e.cause);
      throw new Error(`getOrder error: ${e}`);
    }
  }

  async getTokenDecimals(mint: string): Promise<number> {
    if (this.decimalsCache.has(mint)) return this.decimalsCache.get(mint)!;

    const mintInfo = await this.connection.getParsedAccountInfo(
      new PublicKey(mint)
    );
    const data = mintInfo.value?.data as ParsedAccountData | null;
    const decimals = data?.parsed?.info?.decimals;

    if (typeof decimals !== "number") {
      return 9;
    }

    this.decimalsCache.set(mint, decimals);
    return decimals;
  }

  convertAmountToBN(amount: number, decimals: number): BN {
    const multiplier = Math.pow(10, decimals);
    return new BN(Math.floor(amount * multiplier));
  }

  convertBNToAmount(amount: BN, decimals: number): number {
    return amount.toNumber() / Math.pow(10, decimals);
  }
}
