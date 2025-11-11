async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ChamaFactory = await ethers.getContractFactory("ChamaFactory");
  const chamaFactory = await ChamaFactory.deploy();
  await chamaFactory.waitForDeployment();

  const address = await chamaFactory.getAddress();
  console.log("ChamaFactory deployed to:", address);
  console.log("Add to your .env as CHAMA_FACTORY_ADDRESS=%s", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

