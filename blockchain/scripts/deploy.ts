import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect(); // uses --network value

  if (!viem || typeof viem.deployContract !== "function") {
    console.error(
      "viem deploy helper not found. Ensure @nomicfoundation/hardhat-toolbox-viem is installed and imported in hardhat.config.ts"
    );
    process.exitCode = 1;
    return;
  }

  console.log("Deploying BSCS4BBudgetBill contract with viem...");
  const deployed = await viem.deployContract("BSCS4BBudgetBill"); // artifact name from contracts
  console.log("BSCS4BBudgetBill deployed to:", deployed.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
