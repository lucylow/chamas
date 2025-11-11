const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying Chamas to", hre.network.name, "...\n");

  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📍 Deployer:", deployer.address);
  console.log("🌐 Network:", network.name, "| Chain:", network.chainId, "\n");

  console.log("⏳ Deploying Chama implementation...");
  const Chama = await ethers.getContractFactory("Chama");
  const chama = await Chama.deploy();
  await chama.waitForDeployment();
  console.log("✅ Chama:", chama.target, "\n");

  console.log("⏳ Deploying ChamaToken...");
  const ChamaToken = await ethers.getContractFactory("ChamaToken");
  const token = await ChamaToken.deploy("Chama Vote", "CHAMA");
  await token.waitForDeployment();
  console.log("✅ ChamaToken:", token.target, "\n");

  console.log("⏳ Deploying ChamaFactory...");
  const ChamaFactory = await ethers.getContractFactory("ChamaFactory");
  const factory = await ChamaFactory.deploy(chama.target, token.target);
  await factory.waitForDeployment();
  console.log("✅ ChamaFactory:", factory.target, "\n");

  const addresses = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    chamaImplementation: chama.target,
    chamaToken: token.target,
    chamaFactory: factory.target,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("deployment.json", JSON.stringify(addresses, null, 2));

  console.log("📝 Deployment saved to deployment.json");
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("\nContract Addresses:");
  console.log("  ChamaFactory:", factory.target);
  console.log("  Chama Impl:  ", chama.target);
  console.log("  ChamaToken:  ", token.target);
  console.log("\n⚠️  SAVE THESE ADDRESSES! You'll need them for the frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
