const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ChamaFactory", function () {
  const contributionAmount = ethers.parseUnits("100", 6);
  const contributionFrequency = 7 * 24 * 60 * 60; // 1 week
  const maxMembers = 5;

  let deployer;
  let alice;
  let bob;
  let carol;

  let mockToken;
  let chamaImplementation;
  let governanceToken;
  let factory;

  const chamaName = "Kilimo Savings";
  const chamaDesc = "Agricultural equipment and farming inputs";

  beforeEach(async function () {
    [deployer, alice, bob, carol] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test USDC", "tUSDC", 6, 0n);
    await mockToken.waitForDeployment();

    const Chama = await ethers.getContractFactory("Chama");
    chamaImplementation = await Chama.deploy();
    await chamaImplementation.waitForDeployment();

    const ChamaToken = await ethers.getContractFactory("ChamaToken");
    governanceToken = await ChamaToken.deploy("Chama Vote", "CHAMA");
    await governanceToken.waitForDeployment();

    const Factory = await ethers.getContractFactory("ChamaFactory");
    factory = await Factory.deploy(chamaImplementation.target, governanceToken.target);
    await factory.waitForDeployment();

    const mintAmount = ethers.parseUnits("100000", 6);
    await mockToken.mintTo(deployer.address, mintAmount);
    await mockToken.mintTo(alice.address, mintAmount);
    await mockToken.mintTo(bob.address, mintAmount);
    await mockToken.mintTo(carol.address, mintAmount);
  });

  async function createDefaultChama(overrides = {}) {
    const tx = await factory.createChama(
      overrides.name || chamaName,
      overrides.description || chamaDesc,
      overrides.contributionAmount || contributionAmount,
      overrides.contributionFrequency || contributionFrequency,
      overrides.tokenAddress || mockToken.target,
      overrides.maxMembers || maxMembers
    );
    await tx.wait();
    return 1;
  }

  function chamaAt(chamaId = 1) {
    return factory.getChamaAddress(chamaId).then((addr) => ethers.getContractAt("Chama", addr));
  }

  it("creates a chama and stores details", async function () {
    const chamaId = await createDefaultChama();

    const details = await factory.getChamaDetails(chamaId);
    expect(details.id).to.equal(BigInt(chamaId));
    expect(details.name).to.equal(chamaName);
    expect(details.description).to.equal(chamaDesc);
    expect(details.creator).to.equal(deployer.address);
    expect(details.contributionAmount).to.equal(contributionAmount);
    expect(details.tokenAddress).to.equal(mockToken.target);
    expect(details.maxMembers).to.equal(BigInt(maxMembers));
    expect(details.active).to.equal(true);

    const activeIds = await factory.getActiveChamaIds();
    expect(activeIds).to.deep.equal([BigInt(chamaId)]);
  });

  it("allows additional members to join and tracks member count", async function () {
    const chamaId = await createDefaultChama();
    const chama = await chamaAt(chamaId);

    await expect(factory.connect(alice).joinChama(chamaId))
      .to.emit(factory, "ChamaJoined")
      .withArgs(chamaId, alice.address, 2n);

    expect(await chama.memberCount()).to.equal(2n);
    expect(await chama.isMember(alice.address)).to.equal(true);
  });

  it("prevents duplicate membership for the same account", async function () {
    const chamaId = await createDefaultChama();
    const chama = await chamaAt(chamaId);

    await factory.connect(alice).joinChama(chamaId);

    await expect(factory.connect(alice).joinChama(chamaId)).to.be.revertedWithCustomError(
      chama,
      "Chama__AlreadyMember"
    );
  });

  it("enforces the maximum member limit", async function () {
    const chamaId = await createDefaultChama({ maxMembers: 2 });
    const chama = await chamaAt(chamaId);

    await factory.connect(alice).joinChama(chamaId);

    await expect(factory.connect(bob).joinChama(chamaId)).to.be.revertedWithCustomError(
      chama,
      "Chama__MaxMembersReached"
    );
  });

  it("requires members to contribute with approved allowance", async function () {
    const chamaId = await createDefaultChama();
    const chama = await chamaAt(chamaId);

    await expect(factory.connect(alice).contribute(chamaId, contributionAmount)).to.be.revertedWithCustomError(
      factory,
      "ChamaFactory__NotMember"
    );

    await factory.connect(alice).joinChama(chamaId);

    await expect(factory.connect(alice).contribute(chamaId, contributionAmount)).to.be.revertedWith(
      "ERC20: insufficient allowance"
    );

    await mockToken.connect(alice).approve(factory.target, contributionAmount);

    await expect(factory.connect(alice).contribute(chamaId, contributionAmount))
      .to.emit(factory, "ContributionMade")
      .withArgs(chamaId, alice.address, contributionAmount);

    const contributionTotal = await chama.totalContributed(alice.address);
    expect(contributionTotal).to.equal(contributionAmount);

    const chamaBalance = await mockToken.balanceOf(chama.target);
    expect(chamaBalance).to.equal(contributionAmount);
  });

  it("processes rotation and transfers payout to the correct member", async function () {
    const chamaId = await createDefaultChama({ maxMembers: 3 });
    const chama = await chamaAt(chamaId);

    await factory.connect(alice).joinChama(chamaId);
    await factory.connect(bob).joinChama(chamaId);

    const members = [deployer, alice, bob];
    for (const member of members) {
      await mockToken.connect(member).approve(factory.target, contributionAmount * 3n);
      await factory.connect(member).contribute(chamaId, contributionAmount);
    }

    await time.increase(contributionFrequency + 1);

    const creatorBalanceBefore = await mockToken.balanceOf(deployer.address);

    await expect(factory.processRotation(chamaId))
      .to.emit(factory, "RotationProcessed")
      .withArgs(chamaId, 0n, deployer.address, contributionAmount * 3n);

    const creatorBalanceAfter = await mockToken.balanceOf(deployer.address);
    expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(contributionAmount * 3n);

    const recordedRecipient = await chama.rotationRecipient(0n);
    expect(recordedRecipient).to.equal(deployer.address);
  });

  it("allows the creator to close a chama", async function () {
    const chamaId = await createDefaultChama();
    const chama = await chamaAt(chamaId);

    await expect(factory.connect(alice).closeChama(chamaId)).to.be.revertedWithCustomError(
      factory,
      "ChamaFactory__Unauthorized"
    );

    await expect(factory.closeChama(chamaId)).to.emit(factory, "ChamaClosed").withArgs(chamaId);

    const details = await factory.getChamaDetails(chamaId);
    expect(details.active).to.equal(false);

    await expect(factory.joinChama(chamaId)).to.be.revertedWithCustomError(factory, "ChamaFactory__InactiveChama");
    expect(await chama.nextRotationTime()).to.be.gt(0n); // still set
  });

  it("only owner can update the chama implementation", async function () {
    const NewChama = await ethers.getContractFactory("Chama");
    const newImplementation = await NewChama.deploy();
    await newImplementation.waitForDeployment();

    await expect(factory.connect(alice).setChamaImplementation(newImplementation.target)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await expect(factory.setChamaImplementation(newImplementation.target))
      .to.emit(factory, "ChamaImplementationUpdated")
      .withArgs(chamaImplementation.target, newImplementation.target);
  });
});
