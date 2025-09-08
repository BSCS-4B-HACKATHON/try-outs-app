import mongoose from "mongoose";

export interface txHashType {
  txHash: string;
  type:
    | "approveSender"
    | "approveRecipient"
    | "transferOwnership"
    | "addTransaction";
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
  },
  { timestamps: true }
);

export const TxHash = mongoose.model<txHashType>("TxHash", txHashSchema);
