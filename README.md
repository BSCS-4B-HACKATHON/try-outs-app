# BSCS4BBudgetBill — Tryouts Project (Raite Hackathon)

A university tryouts project inspired by Senator Bam Aquino's "budget bill". This repo demonstrates how contract-recorded transaction metadata can improve transparency and auditability. The system records transaction metadata on-chain (it does not move real funds — only gas is consumed for on‑chain writes). The repo contains three parts:

- `blockchain` — Solidity contracts, Hardhat config and deploy scripts
- `BE` — Express backend, MongoDB persistence and contract relayer services
- `FE` — React/Vite frontend

---

## What this project does

- Stores authorized senders and recipients on-chain.
- Records transaction metadata on-chain (and/or in the BE DB) for fast querying and public audit.
- Uses a relay flow for UX simplicity: payment → wait for receipt → relay record to BE which can persist and/or write to contract.

> Note: this records metadata only. It does not transfer fiat or token balances unless you explicitly call a payable function.

---

## Repo layout (important paths)

- idea_proto/blockchain
  - contracts/BSCS4BBudgetBill.sol
  - scripts/deploy.ts
  - artifacts/ (Hardhat build artifacts)
- idea_proto/BE
  - src/controllers, src/services
  - src/blockchain/artifacts (put BE ABI here)
- idea_proto/FE
  - src/blockchain/abi (put FE ABI here)
  - src/pages, src/components

Deployed/compiled ABI (source):

- idea_proto/blockchain/artifacts/contracts/BSCS4BBudgetBill.sol/BSCS4BBudgetBill.json

---

## Environment variables

Place a `.env` in the root of each of `blockchain`, `BE`, and `FE`.

BE `.env`:

- PRIVATE_KEY=
- CONTRACT_ADDRESS=
- RPC_URL=
- ABI_PATH=
- ADMIN_API_KEY=
- PORT=
- MONGO_URI=

FE `.env`:

- VITE_CONTRACT_ADDRESS=
- VITE_ABI_PATH=
- VITE_RPC_URL=

blockchain `.env`:

- PRIVATE_KEY=
- CONTRACT_ADDRESS=
- SENDER_PRIVATE_KEY=
- RPC_URL=

You can replace the ABI JSON on BE:

- `idea_proto/BE/src/blockchain/artifacts`

You can replace the ABI JSON on FE:

- `idea_proto/FE/src/blockchain/abi`

---

## Build, deploy & verify

1. Install deps (in each folder):

   - npm install

2. Compile contract (inside `idea_proto/blockchain`):

   - npx hardhat compile

3. Deploy:

   - Edit `idea_proto/blockchain/.env` with PRIVATE_KEY and RPC_URL
   - npx hardhat run scripts/deploy.ts --network <network>
   - Copy deployed address to BE/FE env (`CONTRACT_ADDRESS` / `VITE_CONTRACT_ADDRESS`)

4. Verify on Basescan (Standard JSON Input)
   - Extract Hardhat standard input JSON:
     ```
     node -e 'const fs=require("fs");const p="artifacts/build-info";const files=fs.readdirSync(p);if(!files.length)throw new Error("no build-info");const bi=JSON.parse(fs.readFileSync(`${p}/${files[0]}`,"utf8"));fs.writeFileSync("standard-input.json",JSON.stringify(bi.input,null,2));console.log("wrote standard-input.json from",files[0]);'
     ```
   - Upload the produced `standard-input.json` in Basescan's "Standard JSON Input" verifier.

---

## Run (dev)

Start BE and FE in separate terminals:

- idea_proto/BE
  - npm run dev
- idea_proto/FE
  - npm run dev

---

## Backend routes (BE)

- POST /approve-sender — approve a wallet to send
- POST /approve-recipient — approve a recipient
- POST /add-transaction — (legacy; not used in tryouts)
- POST /relay-add-transaction — recommended relay entry used in tryouts
- GET /transactions — list DB transactions
- GET /transaction/:index — read on-chain transaction by index
- GET /transaction-count — number of on-chain transactions
- GET /approved-senders — list approved senders
- GET /approved-recipients — list approved recipients
- POST /transfer-ownership — transfer contract admin

---

## Notes on txHash & flow

- A contract cannot know its own tx hash during execution. Common flows:
  1. Two‑TX flow (used here): user sends a payment (or other tx). After `receipt = tx.wait()` the client posts `receipt.transactionHash` to `/relay-add-transaction` (server saves to DB or writes a second on‑chain record).
  2. Event indexing: emit events and index logs off‑chain (preferred for single‑tx UX but needs indexing infra).
- For tryouts we used relay-add-transaction and DB storage to keep UX simple and we don't know how to get Tx hashes from the smart contract yet.

---

## Database

- BE persists records to MongoDB because we don't know how to get Tx hashes in the smart contract yet. Set `MONGO_URI` in the BE `.env`.

---

## Approval model

- Only approved senders and approved recipients can be used in transactions. This models authorized government actors.

To approve a wallet, go to: `BASE_URL/approve`

---

## Design quirk (honest note)

YES, i know, "receivers" concept is out of logic — there shouldn't even be a receiver since you are sending the transaction on the smart contract itself. We realized it late but we passed, so yeah, not changing anything here.

---

## Troubleshooting

- Explorer shows "Similar Match" during verification → upload Hardhat `standard-input.json` (see Extract step).
- ABI mismatch errors → ensure BE/FE use the same ABI JSON that matches the deployed bytecode.
- If stored `txHash` is `0x00...` → client did not supply `receipt.transactionHash`; ensure the client waits for the receipt and supplies it.

---

## Credits

- Project: University tryouts for Raite Hackathon
- Inspiration: Senator Bam Aquino's blockchain budget transparency idea
- Author / Team: (project owner)
