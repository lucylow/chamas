const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChamaFactory", function () {
  let chamaFactory;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ChamaFactory = await ethers.getContractFactory("ChamaFactory");
    chamaFactory = await ChamaFactory.deploy();
    await chamaFactory.waitForDeployment();
  });

  it("creates a chama", async function () {
    const tx = await chamaFactory.createChama(
      "Kilimo Savings",
      ethers.parseUnits("500", 18),
      604800
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "ChamaCreated"
    );
    const chamaId = event.args.chamaId;

    const chama = await chamaFactory.getChamaInfo(chamaId);
    expect(chama.name).to.equal("Kilimo Savings");
    expect(chama.owner).to.equal(owner.address);
    expect(chama.memberCount).to.equal(1n);
  });

  it("allows joining a chama", async function () {
    await chamaFactory.createChama(
      "Tech Fund",
      ethers.parseUnits("1000", 18),
      604800
    );

    await chamaFactory.connect(addr1).joinChama(1);
    await chamaFactory.connect(addr2).joinChama(1);

    const chama = await chamaFactory.getChamaInfo(1);
    expect(chama.memberCount).to.equal(3n);
  });

  it("tracks contributions", async function () {
    await chamaFactory.createChama(
      "School Fund",
      ethers.parseUnits("200", 18),
      604800
    );

    await chamaFactory.connect(addr1).joinChama(1);
    await chamaFactory
      .connect(addr1)
      .contribute(1, { value: ethers.parseUnits("200", 18) });

    const chama = await chamaFactory.getChamaInfo(1);
    expect(chama.totalFunds).to.equal(ethers.parseUnits("200", 18));
  });
});

