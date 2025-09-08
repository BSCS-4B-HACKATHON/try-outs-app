import express from "express";
import cors from "cors";
import blockchainRoutes from "./routes/blockchainRoutes";
import "dotenv/config";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.mongo_uri!)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.use("/api/blockchain", blockchainRoutes);
const PORT = process.env.PORT || 7569;

app.get("/", (_req, res) => {
  res.send("Hello, Blockchain API is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
