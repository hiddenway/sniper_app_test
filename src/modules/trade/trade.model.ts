import { DataTypes, Model } from "sequelize";
import sequelize from "../../database";

export class Trade extends Model {
  declare id: number;
  declare user_id: number;
  declare buy_id: number | null;
  declare input_mint: string;
  declare output_mint: string;
  declare side: "buy" | "sell";
  declare input_amount: string;
  declare output_amount: string;
  declare price: string;
  declare tx_hash: string;
  declare timestamp: number;
  declare isSold: boolean;
  declare input_mint_decimals: number;
  declare output_mint_decimals: number;
  declare token_name: string;
  declare token_symbol: string;
}

Trade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },

    buy_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "trades",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    input_mint: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    output_mint: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    side: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: false,
    },

    input_amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    output_amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(32, 18),
      allowNull: false,
    },

    tx_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    timestamp: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },

    input_mint_decimals: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },

    output_mint_decimals: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },

    token_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    token_symbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "trades",
  }
);
