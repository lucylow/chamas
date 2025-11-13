const hre = require("hardhat");
const fs = require("fs");

const DEFAULT_FACTORY_ADDRESS = "0xcccccccccccccccccccccccccccccccccccccccc";
const DEFAULT_USDC_ADDRESS = "0x6f14c9687ccf0532413d582b8f6320802f89f90a";

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

  const factory = await ethers.getContractAt("ChamaFactory", FACTORY_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  const [creator, user1, user2, user3] = await ethers.getSigners();

  console.log("📝 Creating demo chamas...\n");

  const chamaDefinitions = [
    {
      name: "Kilimo Savings",
      description: "Agricultural equipment and farming inputs",
      contribution: ethers.parseUnits("500", 6),
      frequency: 604800,
      maxMembers: 5,
    },
    {
      name: "Tech Fund",
      description: "Tech startup investment and learning",
      contribution: ethers.parseUnits("1000", 6),
      frequency: 2592000,
      maxMembers: 6,
    },
    {
      name: "School Fees Chama",
      description: "Children's education funding",
      contribution: ethers.parseUnits("200", 6),
      frequency: 604800,
      maxMembers: 8,
    },
  ];

  const createdIds = [];

  for (const definition of chamaDefinitions) {
    console.log(`🔧 Creating ${definition.name}...`);
    const tx = await factory.createChama(
      definition.name,
      definition.description,
      definition.contribution,
      definition.frequency,
      USDC_ADDRESS,
      definition.maxMembers
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "ChamaCreated");
    const chamaId = event ? event.args.chamaId : null;
    if (chamaId !== null) {
      createdIds.push(chamaId);
      console.log(`✅ ${definition.name} created with ID ${chamaId}`);
    } else {
      console.log("⚠️  Unable to find chama ID in event logs");
    }
  }

  const chamaIds = await factory.getActiveChamaIds();
  console.log("\n🔢 Total demo chamas:", chamaIds.length);

  for (const id of chamaIds) {
    const details = await factory.getChamaDetails(id);
    console.log(`\n📊 Chama ${id}:`);
    console.log(`   Name: ${details.name}`);
    console.log(`   Contribution: ${ethers.formatUnits(details.contributionAmount, 6)} USDC`);
    console.log(`   Max Members: ${details.maxMembers}`);
  }

  await usdc.connect(creator).approve(FACTORY_ADDRESS, ethers.parseUnits("5000", 6));
  await usdc.connect(user1).approve(FACTORY_ADDRESS, ethers.parseUnits("5000", 6));
  await usdc.connect(user2).approve(FACTORY_ADDRESS, ethers.parseUnits("5000", 6));
  await usdc.connect(user3).approve(FACTORY_ADDRESS, ethers.parseUnits("5000", 6));

  if (createdIds.length > 0) {
    const firstChamaId = createdIds[0];
    console.log(`\n🙋 Joining first chama (${firstChamaId}) with demo users...`);
    await factory.connect(user1).joinChama(firstChamaId);
    await factory.connect(user2).joinChama(firstChamaId);
    await factory.connect(user3).joinChama(firstChamaId);

    console.log("💸 Making initial contributions...");
    await factory.connect(creator).contribute(firstChamaId, ethers.parseUnits("500", 6));
    await factory.connect(user1).contribute(firstChamaId, ethers.parseUnits("500", 6));
    await factory.connect(user2).contribute(firstChamaId, ethers.parseUnits("500", 6));
    await factory.connect(user3).contribute(firstChamaId, ethers.parseUnits("500", 6));

    console.log("✅ Demo contributions completed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



