import mongoose from "mongoose";

export interface txHashType {
  txHash: string;
  type:
    | "approveSender"
    | "approveRecipient"
    | "transferOwnership"
    | "addTransaction";
  amount: number;
  currency: string;
  from: string;
  to: string;
}

const txHashSchema = new mongoose.Schema<txHashType>(
  {
    txHash: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "approveSender",
        "approveRecipient",
        "transferOwnership",
        "addTransaction",
      ],
      required: true,
    },
    amount: { type: Number, required: false },
    currency: { type: String, required: false },
    from: { type: String, required: false },
    to: { type: String, required: false },
  },
  { timestamps: true }
);

export const TxHash = mongoose.model<txHashType>("TxHash", txHashSchema);
