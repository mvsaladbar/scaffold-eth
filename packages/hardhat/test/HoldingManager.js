const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { parseEvent } = require("./utils/parse_events");
const { EMPTY_ADDRESS, EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

let owner, tokensHolder;
let holdingFactoryContract,
  fullHoldingFactoryContract,
  simpleContract,
  fullProtocolTokenContract,
  fullManager;

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

describe("HoldingManager - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    [owner, tokensHolder] = await ethers.getSigners();

    await mockContracts();
    holdingFactoryContract = await ethers.getContractAt(
      "IHoldingManager",
      fullHoldingFactoryContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should not create a holding contract from a contract which is not whitelisted", async () => {
    await mockSimpleContract();
    await expect(
      simpleContract
        .connect(owner)
        .shouldCreateHolding(holdingFactoryContract.address)
    ).to.revertedWith("1000");
  });

  it("should create a holding contract from a whitelisted contract", async () => {
    await mockSimpleContract();

    await expect(
      fullManager.connect(owner).whitelistContract(simpleContract.address)
    ).to.emit(fullManager, "ContractWhitelisted");

    const createHoldingTx = await simpleContract
      .connect(owner)
      .shouldCreateHolding(holdingFactoryContract.address);
    const createHoldingRc = await createHoldingTx.wait();

    // Need to parse log into event
    const unparsedEv = createHoldingRc.logs.find(
      (evInfo) =>
        evInfo.topics[0] ==
        holdingFactoryContract.filters.HoldingCreated().topics[0]
    );

    const holdingCreatedEv =
      holdingFactoryContract.interface.parseLog(unparsedEv);

    const [creatorAddress, holdingAddress] = holdingCreatedEv.args;

    expect(creatorAddress).to.be.eq(
      simpleContract.address,
      "Holding creator does not match"
    );

    const gasCostInEth = (createHoldingRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gastCostInUsd = gasCostInEth * ethVirtualPrice;
    const isHolding = await holdingFactoryContract.isHolding(holdingAddress);

    console.log(
      `   ➡️ Created holding: ${holdingAddress} with a gas cost of '${gasCostInEth}' ETH or '${gastCostInUsd}' USD`
    );
    console.log(`   ➡️ Is holding: ${isHolding ? "yes" : "no"}`);

    expect(isHolding).to.be.true;
    const holdingOwner = await holdingFactoryContract.holdingUser(
      holdingAddress
    );
    expect(holdingOwner).to.be.eq(
      EMPTY_ADDRESS,
      "Holding should not have owner now"
    );
    const holdingMinter = await holdingFactoryContract.holdingMinter(
      holdingAddress
    );
    expect(holdingMinter).to.be.eq(
      simpleContract.address,
      "Holding minter does not match"
    );
  });

  it("should create a holding contract for a normal user", async () => {
    const createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    const createHoldingRc = await createHoldingTx.wait();

    const gasCostInEth = (createHoldingRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gastCostInUsd = gasCostInEth * ethVirtualPrice;

    const holdingCreatedEv = createHoldingRc.events.find(
      (evInfo) => evInfo.event == "HoldingCreated"
    );

    const [creatorAddress, holdingAddress] = holdingCreatedEv.args;
    expect(creatorAddress).to.be.eq(
      tokensHolder.address,
      "Holding creator does not match"
    );
    const isHolding = await holdingFactoryContract.isHolding(holdingAddress);

    console.log(
      `   ➡️ Created holding: ${holdingAddress} with a gas cost of '${gasCostInEth}' ETH or '${gastCostInUsd}' USD`
    );
    console.log(`   ➡️ Is holding: ${isHolding ? "yes" : "no"}`);
    expect(isHolding).to.be.true;
    const holdingOwner = await holdingFactoryContract.holdingUser(
      holdingAddress
    );
    expect(holdingOwner).to.be.eq(
      EMPTY_ADDRESS,
      "Holding should not have owner now"
    );
    const holdingMinter = await holdingFactoryContract.holdingMinter(
      holdingAddress
    );
    expect(holdingMinter).to.be.eq(
      tokensHolder.address,
      "Holding minter does not match"
    );
    const availableHoldingsHead =
      await holdingFactoryContract.availableHoldingsHead();
    const nextAvailableHolding = await holdingFactoryContract.availableHoldings(
      availableHoldingsHead
    );
    expect(nextAvailableHolding).to.be.eq(holdingAddress);
    const assignTx = await holdingFactoryContract
      .connect(owner)
      .assignHolding(tokensHolder.address);
    await assignTx.wait();
    expect(
      await holdingFactoryContract.userHolding(tokensHolder.address)
    ).to.be.eq(holdingAddress);
  });

  it("should create a holding contract for myself", async () => {
    const createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHoldingForMyself();
    const createHoldingRc = await createHoldingTx.wait();

    const gasCostInEth = (createHoldingRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gastCostInUsd = gasCostInEth * ethVirtualPrice;

    const holdingCreatedEv = createHoldingRc.events.find(
      (evInfo) => evInfo.event == "HoldingCreated"
    );

    const [creatorAddress, holdingAddress] = holdingCreatedEv.args;
    expect(creatorAddress).to.be.eq(
      tokensHolder.address,
      "Holding creator does not match"
    );
    const isHolding = await holdingFactoryContract.isHolding(holdingAddress);

    console.log(
      `   ➡️ Created holding: ${holdingAddress} with a gas cost of '${gasCostInEth}' ETH or '${gastCostInUsd}' USD`
    );
    console.log(`   ➡️ Is holding: ${isHolding ? "yes" : "no"}`);
    expect(isHolding).to.be.true;
    const holdingOwner = await holdingFactoryContract.holdingUser(
      holdingAddress
    );
    expect(holdingOwner).to.be.eq(
      tokensHolder.address,
      "Holding owner does not match"
    );
    const holdingMinter = await holdingFactoryContract.holdingMinter(
      holdingAddress
    );
    expect(holdingMinter).to.be.eq(
      tokensHolder.address,
      "Holding minter does not match"
    );
  });

  it("should not be able to create multiple holding contracts for myself", async () => {
    let createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHoldingForMyself();
    await createHoldingTx.wait();
    expect(
      holdingFactoryContract.connect(tokensHolder).createHoldingForMyself()
    ).to.be.revertedWith("1101");
  });

  it("should not let a user receive multiple holding contracts", async () => {
    let createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    await createHoldingTx.wait();

    createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    await createHoldingTx.wait();

    let userHolding = await holdingFactoryContract.userHolding(
      tokensHolder.address
    );
    console.log("userHolding: ", userHolding);
    const assignTx = await holdingFactoryContract
      .connect(owner)
      .assignHolding(tokensHolder.address);
    await assignTx.wait();
    userHolding = await holdingFactoryContract.userHolding(
      tokensHolder.address
    );
    console.log("userHolding: ", userHolding);
    expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.be.revertedWith("1101");
  });

  it("should let a user grab a holding for himself", async () => {
    let createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    await createHoldingTx.wait();
    await expect(
      holdingFactoryContract.connect(tokensHolder).assignHoldingToMyself()
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

    USDCContract = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const transferUSDC = await USDCContract.connect(binanceWallet).transfer(
      tokensHolder.address,
      (10000 * 1e6).toString()
    );
    await transferUSDC.wait();
    const firstDepositAmount = await fullManager.firstDepositAmount();
    const approveUSDC = await USDCContract.connect(tokensHolder).approve(
      holdingFactoryContract.address,
      firstDepositAmount
    );
    await approveUSDC.wait();
    const assignHoldingToMyselfTx = holdingFactoryContract
      .connect(tokensHolder)
      .assignHoldingToMyself();
    await expect(assignHoldingToMyselfTx).to.emit(
      holdingFactoryContract,
      "Deposit"
    );
    await expect(assignHoldingToMyselfTx).to.emit(
      holdingFactoryContract,
      "HoldingAssigned"
    );
  });

  it("should create 10 holding contracts", async () => {
    const _createHolding = async () => {
      const createHoldingTx = await holdingFactoryContract
        .connect(tokensHolder)
        .createHolding();
      const createHoldingRc = await createHoldingTx.wait();
      const gasCostInEth = (createHoldingRc.gasUsed * gweiVirtual) / 10 ** 9;
      const gastCostInUsd = gasCostInEth * ethVirtualPrice;
      return gastCostInUsd;
    };

    let sum = 0;
    for (var i = 0; i < 10; i++) {
      sum += await _createHolding();
    }

    console.log(`   ➡️ Total USD cost: ${sum}`);

    const numAvailableHoldings = await holdingFactoryContract
      .connect(tokensHolder)
      .numAvailableHoldings();
    expect(numAvailableHoldings).to.eq(10, "Invalid number of holdings");
  });

  it("should not create more holding contracts than allowed", async () => {
    const _createHolding = async () => {
      const createHoldingTx = await holdingFactoryContract
        .connect(tokensHolder)
        .createHolding();
      const createHoldingRc = await createHoldingTx.wait();
      const gasCostInEth = (createHoldingRc.gasUsed * gweiVirtual) / 10 ** 9;
      const gastCostInUsd = gasCostInEth * ethVirtualPrice;
      return gastCostInUsd;
    };

    let sum = 0;
    for (var i = 0; i < 9; i++) {
      sum += await _createHolding();
    }

    console.log(`   ➡️ Total USD cost: ${sum}`);

    const numAvailableHoldings = await holdingFactoryContract
      .connect(tokensHolder)
      .numAvailableHoldings();
    expect(numAvailableHoldings).to.eq(9, "Invalid number of holdings");

    const setMaxContractsTx = await fullManager
      .connect(owner)
      .setMaxAvailableHoldings(10);
    await setMaxContractsTx.wait();

    const maxAvailableHoldings = await fullManager
      .connect(tokensHolder)
      .maxAvailableHoldings();
    expect(maxAvailableHoldings).to.eq(
      10,
      "Invalid number of max available holdings"
    );

    expect(
      holdingFactoryContract.connect(tokensHolder).createHolding()
    ).to.be.revertedWith("2000", "Should not let create that many holdings");
  });

  it("should give tokens to the holding minter", async () => {
    const mintingTokenReward = await fullManager
      .connect(tokensHolder)
      .mintingTokenReward();

    const tokenBalance = await fullProtocolTokenContract.balanceOf(
      tokensHolder.address
    );
    const createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    const createHoldingRc = await createHoldingTx.wait();

    // Need to parse log into event
    const tokenTransferEv = parseEvent(
      createHoldingRc,
      fullProtocolTokenContract,
      "Transfer"
    );

    console.log(
      `Holding minter should be rewarded with ${mintingTokenReward} protocol tokens`
    );
    const newTokenBalance = await fullProtocolTokenContract.balanceOf(
      tokensHolder.address
    );
    const [sender, recipient, amount] = tokenTransferEv.args;
    expect(sender).to.be.eq(
      holdingFactoryContract.address,
      "Invalid token sender"
    );
    expect(recipient).to.be.eq(tokensHolder.address, "Invalid token recipient");
    expect(amount).to.be.eq(mintingTokenReward, "Invalid token recipient");
    expect(newTokenBalance - tokenBalance).to.be.eq(
      mintingTokenReward,
      "Invalid balance increase"
    );
    console.log("Correct");
  });
});

async function mockSimpleContract() {
  const factory = await ethers.getContractFactory("SimpleContract");
  simpleContract = await factory.connect(owner).deploy();
}
async function mockContracts() {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["uint", "uint", "uint"],
    [
      "50000", //collateralization ratio 50%
      "110000", //liquidation multiplier; around 12% - 1198 at 10000; the smaller the value, the higher the fee taken
      "0", //"500", //borrow opening fee
    ]
  );

  [
    fullManager,
    fullManagerContainer,
    fullStrategyManager,
    fullHoldingFactoryContract,
    fullDexManagerContract,
    fullProtocolTokenContract,
    fullOracleContract,
    fullPandoraMoneyContract,
    fullStableManagerContract,
    fullShareRegistryContract,
  ] = await deploy_basic_contracts(owner, USDC_ADDRESS, data, EMPTY_BYTES);
}
