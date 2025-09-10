# BSCS4BBudgetBill — Tryouts Project (Raite Hackathon)

Short summary

- University tryouts project inspired by Senator Bam Aquino's blockchain "budget bill".
- The contract records transaction metadata on-chain for transparency — it does not move real money, it only records information and consumes gas for on‑chain writes.
- This repo contains three parts:
  - blockchain (Solidity + Hardhat) — contracts, deploy scripts, build artifacts
  - BE (Express + services) — server that talks to the contract and stores records
  - FE (React/Vite) — frontend to interact with the contract and server

What this project does

- Authorized senders and recipients are recorded on the contract.
- Transactions (metadata) are recorded on-chain or relayed to the contract; you can also persist transaction records in the BE database for fast querying.
- The contract + off‑chain index allow public auditing of recorded entries for transparency.

Repository layout (relevant paths)

- idea_proto/blockchain
  - contracts/BSCS4BBudgetBill.sol
  - scripts/deploy.ts
  - artifacts/ (build output)
- idea_proto/BE
  - src/controllers, src/services, src/blockchain/artifacts (ABI can be put here)
- idea_proto/FE
  - src/blockchain/abi (FE ABI goes here)
  - src/pages, src/components

Environment (.env) files

- Place .env in the root of each of blockchain, BE and FE folders.

BE (.env)

- PRIVATE_KEY=
- CONTRACT_ADDRESS=
- RPC_URL=
- ABI_PATH=
- ADMIN_API_KEY=
- PORT=
- MONGO_URI=

FE (.env)

- VITE_CONTRACT_ADDRESS=
- VITE_ABI_PATH=
- VITE_RPC_URL=

blockchain (.env)

- PRIVATE_KEY=
- CONTRACT_ADDRESS=
- SENDER_PRIVATE_KEY=
- RPC_URL=

ABI files

- You can replace ABI JSON on BE:
  - idea_proto/BE/src/blockchain/artifacts
- You can replace ABI JSON on FE:
  - idea_proto/FE/src/blockchain/abi
- Build artifact (source ABI) location after compile:
  - idea_proto/blockchain/artifacts/contracts/BSCS4BBudgetBill.sol/BSCS4BBudgetBill.json

Build, deploy and run

1. Install dependencies

   - For each folder (blockchain, BE, FE) run:
     - npm install

2. Compile contract (in idea_proto/blockchain)

   - npx hardhat compile

3. Deploy

   - Edit idea_proto/blockchain/.env with PRIVATE_KEY and RPC_URL
   - npx hardhat run scripts/deploy.ts --network <your-network>
   - The deploy script prints the deployed address — copy it to BE/.env and FE/.env as CONTRACT_ADDRESS / VITE_CONTRACT_ADDRESS.

4. Verify contract on Basescan (if needed)
   - Use the exact Standard‑Input‑JSON that Hardhat produced. Extract it with a script:
     - node -e 'const fs=require("fs");const p="artifacts/build-info";const files=fs.readdirSync(p);if(!files.length)throw new Error("no build-info");const bi=JSON.parse(fs.readFileSync(`${p}/${files[0]}`,"utf8"));fs.writeFileSync("standard-input.json",JSON.stringify(bi.input,null,2));console.log("wrote standard-input.json from",files[0]);'
   - Upload the generated `standard-input.json` to Basescan verifier (choose "Standard JSON Input").
   - Alternative: use Hardhat verify plugin if configured:
     - npx hardhat verify --network base_sepolia <DEPLOYED_ADDRESS>

Helpful note about the provided extract step

- The repo also includes a convenience script / mention: run `node extractInput.js` (or use the one-liner above) to produce `standard-input.json` used by the explorer UI.

ABI source to copy to BE/FE

- idea_proto/blockchain/artifacts/contracts/BSCS4BBudgetBill.sol/BSCS4BBudgetBill.json
  - Copy the ABI JSON part to:
    - idea_proto/BE/src/blockchain/artifacts
    - idea_proto/FE/src/blockchain/abi

Running the app

- Start BE and FE simultaneously for development:
  - In idea_proto/BE: npm run dev
  - In idea_proto/FE: npm run dev
- Or run them separately in different terminals.

Backend routes (BE)

- POST /approve-sender — approve a wallet as sender
- POST /approve-recipient — approve a wallet as recipient
- POST /add-transaction — (not used for tryouts; kept for compatibility)
- POST /relay-add-transaction — recommended: relay the transaction data (server will write to contract or DB)
- GET /transactions — list of transactions (DB)
- GET /transaction/:index — read one contract-stored transaction (by index)
- GET /transaction-count — number of transactions stored on contract
- GET /approved-senders — list approved senders
- GET /approved-recipients — list approved recipients
- POST /transfer-ownership — transfer admin key in contract

Record flow and txHash

- A contract cannot know its own transaction hash during execution. Two practical approaches:
  1. Two‑tx flow (used here): user sends payment (or other tx), waits for receipt, then call addTransaction / relay endpoint with receipt.transactionHash. This produces two on‑chain writes (payment and separate record), or one on‑chain write + DB record if you use the server relayer.
  2. Off‑chain indexing: emit events from the contract and index logs off‑chain (explorer, provider). This avoids storing txHash in storage but requires log scanning.
- For tryouts we used relay-add-transaction and DB storage to keep UX simple and we don't know how to get Tx hashes from the smart contract yet.

Database

- BE persists transaction records to MongoDB because we still don't know how to fetch all Tx hashes from the smart contract. Ensure MONGO_URI (or mongo_uri in some configs) is set in the BE .env.

Approval model

- The contract requires approved senders and recipients. Only approved entities can add transactions and recipients to receive transactions this limits who can record data and simulates government-authorized participants.

UI notes

- The frontend is intentionally designed to not feel like a government UI.
- There is a "Refresh lists" feature, "Approve" flow, and transaction history UI that links to Basescan for each tx.

Important: does this move real funds?

- No — this project records metadata only. It does not transfer real money or on-chain currency unless you explicitly call a payable contract function or send funds separately. Gas fees still apply for on‑chain writes.

Design quirk

- YES, the "receivers" concept is slightly awkward — the contract stores a recipient even though the transaction is recorded on the contract itself. We realized this late but kept the design as-is because we passed.

Where to find the deployed contract & deploy info in this repo

- Contract source (used for the tryouts): idea_proto/blockchain/contracts/BSCS4BBudgetBill.sol
- Deploy script used: idea_proto/blockchain/scripts/deploy.ts
- If you need the exact ABI JSON to drop into FE/BE:
  - idea_proto/blockchain/artifacts/contracts/BSCS4BBudgetBill.sol/BSCS4BBudgetBill.json

Quick troubleshooting

- If the explorer shows a "Similar Match" during verification, use the Standard-Input-JSON (build-info) produced by Hardhat.
- If addTransaction call fails due to ABI mismatch, ensure your BE/FE ABI matches the deployed contract ABI.
- If txHash stored is zero (0x00...), check that the client actually provided receipt.transactionHash — we default to zero bytes when missing.

Contact / Credits

- Project: University tryouts for Raite Hackathon
- Inspiration: Senator Bam Aquino's blockchain idea for budget transparency
- Author: (project owner)
