import { Router } from "express";
import {
  addTransactionHandler,
  approveRecipientHandler,
  approveSenderHandler,
  getApprovedRecipientsHandler,
  getApprovedSendersHandler,
  getTransactionCountHandler,
  getTransactionHandler,
  getTransactionsHandler,
  relayAddTransactionHandler,
  transferOwnershipHandler,
} from "../controllers/chainControllers";

const router = Router();

router.get("/", (_req, res) => {
  res.send("Hello, Blockchain API is running!");
});
router.post("/approve-sender", approveSenderHandler);
router.post("/approve-recipient", approveRecipientHandler);
router.post("/add-transaction", addTransactionHandler);
router.post("/relay-add-transaction", relayAddTransactionHandler);
router.get("/transactions", getTransactionsHandler);
router.get("/transaction/:index", getTransactionHandler);
router.get("/transaction-count", getTransactionCountHandler);
router.get("/approved-senders", getApprovedSendersHandler);
router.get("/approved-recipients", getApprovedRecipientsHandler);
router.post("/transfer-ownership", transferOwnershipHandler);

export default router;
