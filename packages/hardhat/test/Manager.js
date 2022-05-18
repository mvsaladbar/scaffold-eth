const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const { EMPTY_ADDRESS } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;

let owner, tokensHolder;
let managerContract, fullManagerContract;

chai.use(solidity);
let expect = chai.expect;

describe("Manager - Tests mainnet fork", async () => {
  beforeEach(async () => {
    await fork_network();
    [owner, tokensHolder] = await ethers.getSigners();

    await mockContracts();
    managerContract = await ethers.getContractAt(
      "IManager",
      fullManagerContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should set the strategy manager", async () => {
    await expect(
      managerContract.connect(tokensHolder).setStrategyManager(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setStrategyManager(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).setStrategyManager(USDC_ADDRESS)
    ).to.emit(managerContract, "StrategyManagerUpdated");

    await expect(
      managerContract.connect(owner).setStrategyManager(USDC_ADDRESS)
    ).to.revertedWith("3017");
  });

  it("should set the dex manager", async () => {
    await expect(
      managerContract.connect(tokensHolder).setDexManager(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setDexManager(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).setDexManager(USDC_ADDRESS)
    ).to.emit(managerContract, "DexManagerUpdated");

    await expect(
      managerContract.connect(owner).setDexManager(USDC_ADDRESS)
    ).to.revertedWith("3017");
  });

  it("should set the holding manager", async () => {
    await expect(
      managerContract.connect(tokensHolder).setHoldingManager(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setHoldingManager(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).setHoldingManager(USDC_ADDRESS)
    ).to.emit(managerContract, "HoldingManagerUpdated");

    await expect(
      managerContract.connect(owner).setHoldingManager(USDC_ADDRESS)
    ).to.revertedWith("3017");
  });

  it("should set the stablecoin manager", async () => {
    await expect(
      managerContract.connect(tokensHolder).setStablecoinManager(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setStablecoinManager(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).setStablecoinManager(USDC_ADDRESS)
    ).to.emit(managerContract, "StablecoinManagerUpdated");

    await expect(
      managerContract.connect(owner).setStablecoinManager(USDC_ADDRESS)
    ).to.revertedWith("3017");
  });

  it("should set performance fee", async () => {
    await expect(
      managerContract.connect(tokensHolder).setPerformanceFee(100)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setPerformanceFee(20000)
    ).to.revertedWith("3018");

    await expect(
      managerContract.connect(owner).setPerformanceFee(4000)
    ).to.emit(managerContract, "PerformanceFeeUpdated");
  });

  it("should set minting token reward", async () => {
    await expect(
      managerContract.connect(tokensHolder).setMintingTokenReward(10000)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setMintingTokenReward(400000)
    ).to.emit(managerContract, "MintingTokenRewardUpdated");
  });

  it("should set max available holding contracts", async () => {
    await expect(
      managerContract.connect(tokensHolder).setMaxAvailableHoldings(10)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setMaxAvailableHoldings(10)
    ).to.emit(managerContract, "MaxAvailableHoldingsUpdated");
  });

  it("should whitelist token", async () => {
    await expect(
      managerContract.connect(tokensHolder).whitelistToken(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).removeToken(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).whitelistToken(USDC_ADDRESS)
    ).to.emit(managerContract, "TokenWhitelisted");

    await expect(
      managerContract.connect(owner).whitelistToken(USDC_ADDRESS)
    ).to.revertedWith("3019");

    const isTokenWhitelisted = await managerContract.isTokenWhitelisted(
      USDC_ADDRESS
    );
    console.log(
      `   ➡️ Was token whitelisted: ${isTokenWhitelisted ? "yes" : "no"}`
    );

    expect(isTokenWhitelisted, "✖️ Token should be whitelisted").to.be.true;
  });

  it("should remove token from whitelist", async () => {
    await expect(
      managerContract.connect(tokensHolder).removeToken(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).removeToken(USDC_ADDRESS)
    ).to.revertedWith("1000");

    await expect(
      managerContract.connect(owner).removeToken(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).whitelistToken(USDC_ADDRESS)
    ).to.emit(managerContract, "TokenWhitelisted");

    await expect(
      managerContract.connect(owner).removeToken(USDC_ADDRESS)
    ).to.emit(managerContract, "TokenRemoved");

    const isTokenWhitelisted = await managerContract.isTokenWhitelisted(
      USDC_ADDRESS
    );
    console.log(
      `   ➡️ Was token removed: ${isTokenWhitelisted ? "no" : "yes"}`
    );
    expect(!isTokenWhitelisted, "✖️ Token should have been removed").to.be.true;
  });

  it("should whitelist contract", async () => {
    await expect(
      managerContract.connect(tokensHolder).whitelistContract(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).whitelistContract(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).whitelistContract(USDC_ADDRESS)
    ).to.emit(managerContract, "ContractWhitelisted");

    await expect(
      managerContract.connect(owner).whitelistContract(USDC_ADDRESS)
    ).to.revertedWith("3019");

    const isContractWhitelisted = await managerContract.isContractWhitelisted(
      USDC_ADDRESS
    );
    console.log(
      `   ➡️ Was contract whitelisted: ${isContractWhitelisted ? "yes" : "no"}`
    );
    expect(isContractWhitelisted, "✖️ Contract should have been whitelisted").to
      .be.true;
  });

  it("should remove whitelisted contract", async () => {
    await expect(
      managerContract.connect(tokensHolder).blacklistContract(USDC_ADDRESS)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).blacklistContract(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    await expect(
      managerContract.connect(owner).blacklistContract(USDC_ADDRESS)
    ).to.revertedWith("1000");

    await expect(
      managerContract.connect(owner).whitelistContract(USDC_ADDRESS)
    ).to.emit(managerContract, "ContractWhitelisted");

    await expect(
      managerContract.connect(owner).blacklistContract(USDC_ADDRESS)
    ).to.emit(managerContract, "ContractBlacklisted");

    const isContractWhitelisted = await managerContract.isContractWhitelisted(
      USDC_ADDRESS
    );
    console.log(
      `   ➡️ Was contract removed: ${isContractWhitelisted ? "no" : "yes"}`
    );
    expect(!isContractWhitelisted, "✖️ Contract should have been removed").to.be
      .true;
  });


  it("should change the first deposit amount", async () => {
    const newFirstDepositAmount = (1000 * 1e6).toString(); // 1,000 USDC
    await expect(
      managerContract
        .connect(tokensHolder)
        .setFirstDepositAmount(newFirstDepositAmount)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      managerContract.connect(owner).setFirstDepositAmount(0)
    ).to.revertedWith("2001");

    await expect(
      managerContract
        .connect(owner)
        .setFirstDepositAmount(newFirstDepositAmount)
    ).to.emit(managerContract, "FirstDepositAmountUpdated");

    expect(await managerContract.firstDepositAmount()).to.eq(
      newFirstDepositAmount,
      "Invalid amount"
    );
  });
});

async function mockContracts() {
  const managerFactory = await ethers.getContractFactory("Manager");
  fullManagerContract = await managerFactory.connect(owner).deploy(USDC_ADDRESS);
}
