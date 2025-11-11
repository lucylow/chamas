const hre = require("hardhat");
const fs = require("fs");

const DEFAULT_FACTORY_ADDRESS = "0xcccccccccccccccccccccccccccccccccccccccc";
const DEFAULT_USDC_ADDRESS = "0x6f14c9687ccf0532413d582b8f6320802f89f90a"; // Sepolia USDC

function loadDeployment() {
  try {
    const raw = fs.readFileSync("deployment.json", "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

async function main() {
  const { ethers } = hre;

  const deployment = loadDeployment();
  const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || deployment.chamaFactory || DEFAULT_FACTORY_ADDRESS;
  const USDC_ADDRESS = process.env.USDC_ADDRESS || DEFAULT_USDC_ADDRESS;

  if (!ethers.isAddress(FACTORY_ADDRESS)) {
    throw new Error("Invalid FACTORY_ADDRESS provided.");
  }
  if (!ethers.isAddress(USDC_ADDRESS)) {
    throw new Error("Invalid USDC_ADDRESS provided.");
  }

  const [user] = await ethers.getSigners();
  console.log("👤 User:", user.address);

  const factory = await ethers.getContractAt("ChamaFactory", FACTORY_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  const balance = await usdc.balanceOf(user.address);
  console.log("💰 USDC Balance:", ethers.formatUnits(balance, 6));

  console.log("\n📝 Creating chama...");
  const contributionAmount = ethers.parseUnits("10", 6);
  const tx = await factory.createChama(
    "Test Chama",
    "Testing on Sepolia",
    contributionAmount,
    604800,
    USDC_ADDRESS,
    4
  );

  const receipt = await tx.wait();
  console.log("✅ Chama created! Tx hash:", receipt.hash);

  const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "ChamaCreated");
  const chamaId = event ? event.args.chamaId : null;

  if (chamaId !== null) {
    const activeChamaIds = await factory.getActiveChamaIds();
    console.log("🔢 Active chamaIds:", activeChamaIds.map((id) => id.toString()));
    console.log("🆔 New Chama ID:", chamaId.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

