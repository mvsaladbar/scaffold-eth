const { ethers } = require("hardhat");
const chai = require("chai");
const {
  fork_network,
  time_travel,
  fork_reset,
} = require("../utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("../utils/impersonate_account");
const { deploy_basic_contracts } = require("../utils/basic_contracts");
const { parseEvent } = require("../utils/parse_events");
const { EMPTY_BYTES } = require("../utils/constants");

const USDT_ADDRESS = process.env.USDT_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

const tokenOut = "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9"; //cUsdt

let owner, tokensHolder;
let strategyManagerContract,
  fullStrategyManager,
  compoundStrategy,
  fullHoldingFactoryContract,
  fullHoldingContract;
let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

describe("CompoundUsdt - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    [owner, tokensHolder] = await ethers.getSigners();

    await mockContracts();
    strategyManagerContract = await ethers.getContractAt(
      "IStrategyManager",
      fullStrategyManager.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("get rewards", async () => {
    const rewards = await compoundStrategy.getRewards(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Rewards: ${rewards}`);

    expect(parseFloat(rewards), "✖️ Rewards not right").to.eq(0);
  });

  it("should deposit", async () => {
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    await depositIntoHoldingTx.wait();
    console.log(`   ➡️ Holding balance updated`);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        compoundStrategy.address,
        depositUsdtAmount,
        EMPTY_BYTES
      );
    const investRc = await investTx.wait();
    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    let [evSender, evToken, evStrategy, evAmount, evResult] = ev.args;

    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const cTokenContract = await ethers.getContractAt(
      "ICompoundToken",
      tokenOut
    );

    const cTokenDecimals = await cTokenContract.decimals();

    const holdingBalanceOfCToken = await cTokenContract.balanceOf(
      fullHoldingContract.address
    );
    const depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );
    expect(depositInfo[0], "✖️ Invested amount not right").to.eq(
      depositUsdtAmount
    );
    expect(depositInfo[1], "✖️ Shares not right").to.eq(holdingBalanceOfCToken);

    console.log(
      `   ➡️ Total deposited amount: ${parseFloat(depositInfo[0]) / 10 ** 6}`
    );
    console.log(
      `   ➡️ Total shares: ${parseFloat(depositInfo[1]) / 10 ** cTokenDecimals}`
    );
    console.log(
      `   ➡️ Strategy cUsdt balance: ${
        parseFloat(holdingBalanceOfCToken) / 10 ** cTokenDecimals
      }`
    );

    time_travel(259200);

    // Calling this to recalculate the exchange rate appropriately
    const updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();

    const rewards = await compoundStrategy.getRewards(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Rewards: ${rewards}`);
    console.log(`   ➡️ USDT Rewards: ${rewards / 10 ** 6} USDT`);
  });

  it("should deposit multiple times", async () => {
    const balanceUsdtAmount = 200000000000;
    const depositUsdtAmount = 100000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, balanceUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, balanceUsdtAmount);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, balanceUsdtAmount);
    await depositIntoHoldingTx.wait();

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    console.log(`   ➡️ Deposited`);

    time_travel(259200);

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    const cTokenContract = await ethers.getContractAt(
      "ICompoundToken",
      tokenOut
    );

    const cTokenDecimals = await cTokenContract.decimals();

    const holdingBalanceOfCToken = await cTokenContract.balanceOf(
      fullHoldingContract.address
    );
    const depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );
    expect(depositInfo[0], "✖️ Invested amount not right").to.eq(
      balanceUsdtAmount
    );
    expect(depositInfo[1], "✖️ Shares not right").to.eq(holdingBalanceOfCToken);

    console.log(
      `   ➡️ Total deposited amount: ${parseFloat(depositInfo[0]) / 10 ** 6}`
    );
    console.log(
      `   ➡️ Total shares: ${parseFloat(depositInfo[1]) / 10 ** cTokenDecimals}`
    );
    console.log(
      `   ➡️ Strategy cUsdt balance: ${
        parseFloat(holdingBalanceOfCToken) / 10 ** cTokenDecimals
      }`
    );
    // Calling this to recalculate the exchange rate appropriately
    const updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();

    const rewards = await compoundStrategy.getRewards(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Rewards: ${rewards}`);
  });

  it("should withdraw all shares", async () => {
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    await depositIntoHoldingTx.wait();

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    console.log(`   ➡️ Deposit`);

    const depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );

    const cTokenContract = await ethers.getContractAt(
      "ICompoundToken",
      tokenOut
    );

    console.log("⏳ Now advancing time...");
    time_travel(259200);

    console.log("📈 Updating exchange rate");
    updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();

    rewards = await compoundStrategy.getRewards(fullHoldingContract.address);
    console.log(`   ➡️ Rewards: ${rewards}`);

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        compoundStrategy.address,
        depositInfo[1],
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    const withdrawRc = await withdrawTx.wait();

    const withdrawEv = withdrawRc.events.find(
      (evInfo) => evInfo.event == "StrategyClaim"
    );
    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const feeTakenEv = parseEvent(withdrawRc, compoundStrategy, "FeeTaken");

    console.log(`Fee taken: ${feeTakenEv.args.amount}`);

    const balanceOfUsdt = await usdt.balanceOf(fullHoldingContract.address);
    console.log(`   ➡️ Holding balance of USDT  : ${balanceOfUsdt}`);
    expect(balanceOfUsdt, "✖️ Withdrawal amount not right").to.eq(
      withdrawEv.args.tokenAmount
    );
  });

  it("should withdraw half of the shares", async () => {
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    await depositIntoHoldingTx.wait();

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    console.log(`   ➡️ Deposit`);

    const depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );

    const cTokenContract = await ethers.getContractAt(
      "ICompoundToken",
      tokenOut
    );

    console.log("⏳ Now advancing time...");
    time_travel(259200);

    console.log("📈 Updating exchange rate");
    updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();

    rewards = await compoundStrategy.getRewards(fullHoldingContract.address);
    console.log(`   ➡️ Rewards: ${rewards}`);

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        compoundStrategy.address,
        Math.floor(depositInfo[1] / 2), //half
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    const withdrawRc = await withdrawTx.wait();

    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const feeTakenEv = parseEvent(withdrawRc, compoundStrategy, "FeeTaken");

    console.log(`Fee taken: ${feeTakenEv.args.amount}`);

    const balanceOfUsdt = await usdt.balanceOf(fullHoldingContract.address);
    console.log(`   ➡️ Holding balance of USDT  : ${balanceOfUsdt}`);
    expect(
      parseInt(balanceOfUsdt),
      "✖️ Withdrawal amount not right"
    ).to.greaterThan(depositUsdtAmount / 2);
  });

  it("should not be able to claim rewards", async () => {
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    await depositIntoHoldingTx.wait();

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    console.log(`   ➡️ Deposit`);

    // Should not get any rewards since there are none yet
    expect(
      fullStrategyManager
        .connect(tokensHolder)
        .claimRewards(compoundStrategy.address, EMPTY_BYTES)
    ).to.be.revertedWith("3049");
  });

  it("should do a whole flow with multiple operations", async () => {
    const balanceUsdtAmount = 500000000000;
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    const cTokenContract = await ethers.getContractAt(
      "ICompoundToken",
      tokenOut
    );

    let depositInfo, holdingBalanceOfCToken, updateRateTx;
    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, balanceUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, balanceUsdtAmount);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, balanceUsdtAmount);
    await depositIntoHoldingTx.wait();

    console.log("First deposit - 10000 USDT");
    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    console.log(`➡️ Deposited`);

    holdingBalanceOfCToken = await cTokenContract.balanceOf(
      fullHoldingContract.address
    );
    depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );
    expect(depositInfo[0], "✖️ Invested amount not right").to.eq(
      depositUsdtAmount
    );
    expect(depositInfo[1], "✖️ Shares not right").to.eq(holdingBalanceOfCToken);

    await printStatus(cTokenContract, usdt);

    console.log("⏳ Now advancing time...");
    time_travel(259200);

    console.log("📈 Updating exchange rate");
    updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();
    await printStatus(cTokenContract, usdt);

    console.log("Another deposit - 10000 USDT");
    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDT_ADDRESS,
          compoundStrategy.address,
          depositUsdtAmount,
          EMPTY_BYTES
        )
    ).wait();

    depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );
    console.log(`➡️ Deposited`);
    expect(depositInfo[0], "✖️ Invested amount not right").to.eq(
      2 * depositUsdtAmount
    );
    await printStatus(cTokenContract, usdt);

    console.log("⏳ Now advancing time...");
    time_travel(259200);

    console.log("📈 Updating exchange rate");
    updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();
    await printStatus(cTokenContract, usdt);

    console.log(
      "Now withdrawing a part of the investment - a 25% of the shares"
    );
    depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );

    depositAmount = Math.floor(depositInfo[1] / 4);
    console.log("depositAmount", depositAmount);

    withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        compoundStrategy.address,
        depositAmount,
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    console.log("checkpoint");
    withdrawRc = await withdrawTx.wait();
    withdrawEv = withdrawRc.events.find(
      (evInfo) => evInfo.event == "StrategyClaim"
    );

    console.log(`⬅️ Withdrawn ${withdrawEv.args.tokenAmount / 10 ** 6}`);
    await printStatus(cTokenContract, usdt);

    console.log("⏳ Now advancing time...");
    time_travel(259200);

    console.log("📈 Updating exchange rate");
    updateRateTx = await cTokenContract.exchangeRateCurrent();
    await updateRateTx.wait();
    await printStatus(cTokenContract, usdt);

    console.log("Now withdrawing all remaining shares");
    depositInfo = await compoundStrategy.recipients(
      fullHoldingContract.address
    );

    withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        compoundStrategy.address,
        depositInfo[1],
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    withdrawRc = await withdrawTx.wait();
    withdrawEv = withdrawRc.events.find(
      (evInfo) => evInfo.event == "StrategyClaim"
    );

    console.log(`⬅️ Withdrawn ${withdrawEv.args.tokenAmount / 10 ** 6}`);
    await printStatus(cTokenContract, usdt);
  });
});

async function printStatus(cTokenContract, usdt) {
  console.log("STATUS:");
  holdingCTokenBalance = await cTokenContract.balanceOf(
    fullHoldingContract.address
  );
  holdingUsdtBalance = await usdt.balanceOf(fullHoldingContract.address);
  depositInfo = await compoundStrategy.recipients(fullHoldingContract.address);
  console.log(
    `   💰 Total deposited amount: ${parseFloat(depositInfo[0]) / 10 ** 6}`
  );
  console.log(`   🧾 Total shares: ${parseFloat(depositInfo[1]) / 10 ** 8}`);
  console.log(
    `   🧾 ⚖️   Holding cUsdt balance: ${
      parseFloat(holdingCTokenBalance) / 10 ** 8
    }`
  );
  console.log(
    `   📒 ⚖️   Holding Usdt balance: ${
      parseFloat(holdingUsdtBalance) / 10 ** 6
    }`
  );
  rewards = await compoundStrategy.getRewards(fullHoldingContract.address);
  console.log(`   💎 Unclaimed Rewards: ${rewards / 10 ** 6}`);
  console.log("-------\n");
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
  ] = await deploy_basic_contracts(owner, USDT_ADDRESS, data, EMPTY_BYTES);

  const compoundFactory = await ethers.getContractFactory("CompoundStablecoin");
  compoundStrategy = await compoundFactory
    .connect(owner)
    .deploy(fullManagerContainer.address, tokenOut);

  const createHoldingTx = await fullHoldingFactoryContract
    .connect(tokensHolder)
    .createHolding();
  const createHoldingRc = await createHoldingTx.wait();
  const ev = createHoldingRc.events.find(
    (evInfo) => evInfo.event == "HoldingCreated"
  );
  const [evSender, holdingAddress] = ev.args;

  fullHoldingContract = await ethers.getContractAt("IHolding", holdingAddress);

  const assignHoldingTx = await fullHoldingFactoryContract
    .connect(owner)
    .assignHolding(tokensHolder.address);
  await assignHoldingTx.wait();
  await (
    await fullStrategyManager
      .connect(owner)
      .addStrategy(compoundStrategy.address)
  ).wait();

  await (await fullManager.connect(owner).whitelistToken(USDT_ADDRESS)).wait();
}
