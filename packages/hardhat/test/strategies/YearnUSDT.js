const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("../utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("../utils/impersonate_account");
const { deploy_basic_contracts } = require("../utils/basic_contracts");
const { EMPTY_BYTES } = require("../utils/constants");

const USDT_ADDRESS = process.env.USDT_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

let owner, tokensHolder;
let strategyManagerContract,
  fullStrategyManager,
  yearnUsdtStrategy,
  fullHoldingFactoryContract,
  fullHoldingContract,
  usdtShareRegistryContract;

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

describe("Yearn USDT - Tests mainnet fork", async () => {
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

  it("should test initial parameters", async () => {
    const tokenIn = await yearnUsdtStrategy.tokenIn();
    const yearnVault = await yearnUsdtStrategy.yearnVault();
    const managerContainer = await yearnUsdtStrategy.managerContainer();
    expect(tokenIn.toLowerCase(), "✖️ Token not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );
    expect(yearnVault.toLowerCase(), "✖️ Vault not right").to.eq(
      "0x7da96a3891add058ada2e826306d812c638d87a7".toLowerCase()
    );
    expect(
      managerContainer.toLowerCase(),
      "✖️ ManagerContainer not right"
    ).to.eq(fullManagerContainer.address.toLowerCase());
  });

  it("should test get rewards for non-participant", async () => {
    const result = await yearnUsdtStrategy.getRewards(tokensHolder.address);
    expect(result, "✖️ Rewards not right").to.eq(0);
  });

  it("should test multiple deposits", async () => {
    const balanceUsdtAmount = 20000000000;
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const rewardsBeforeFirstDeposit = await yearnUsdtStrategy.getRewards(
      tokensHolder.address
    );
    console.log(
      `   ➡️ Rewards before first deposit: ${rewardsBeforeFirstDeposit}`
    );
    expect(
      rewardsBeforeFirstDeposit,
      "✖️ Rewards before first deposit not right"
    ).to.eq(0);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, balanceUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, balanceUsdtAmount);
    const depositTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, balanceUsdtAmount);
    await depositTx.wait();

    const collateralBeforeFirstDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    expect(
      collateralBeforeFirstDeposit,
      "✖️ Collateral before first deposit not right"
    ).to.eq(balanceUsdtAmount);

    let [evHolding, evSender, evToken, evStrategy, evAmount, evResult] =
      await _deposit(depositUsdtAmount);
    const collateralAfterFirstDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    expect(
      collateralAfterFirstDeposit,
      "✖️ Collateral after first deposit not right"
    ).to.eq(balanceUsdtAmount);

    const rewardsAfterFirstDeposit = await yearnUsdtStrategy.getRewards(
      tokensHolder.address
    );
    console.log(
      `   ➡️ Rewards after first deposit: ${rewardsAfterFirstDeposit}`
    );
    expect(
      rewardsAfterFirstDeposit,
      "✖️ Rewards after first deposit not right"
    ).to.eq(0);

    expect(evHolding.toLowerCase(), "✖️ Holding not right").to.eq(
      fullHoldingContract.address.toLowerCase()
    );

    expect(evSender.toLowerCase(), "✖️ Sender not right").to.eq(
      tokensHolder.address.toLowerCase()
    );

    expect(evToken.toLowerCase(), "✖️ Token not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );

    expect(evStrategy.toLowerCase(), "✖️ Strategy not right").to.eq(
      yearnUsdtStrategy.address.toLowerCase()
    );
    console.log(`   ➡️ Deposited successfuly`);
    const collateralBeforeSecondDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    expect(
      collateralBeforeSecondDeposit,
      "✖️ Collateral before second deposit not right"
    ).to.eq(balanceUsdtAmount);
    [evHolding, evSender, evToken, evStrategy, evAmount, evResult] =
      await _deposit(depositUsdtAmount);
    console.log(`   ➡️ Deposited successfuly`);
    const collateralAfterSecondDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    expect(
      collateralAfterSecondDeposit,
      "✖️ Collateral after second deposit not right"
    ).to.eq(balanceUsdtAmount);
    const depositInfo = await yearnUsdtStrategy.recipients(
      fullHoldingContract.address
    );
    const rewardsAfterSecondDeposit = await yearnUsdtStrategy.getRewards(
      tokensHolder.address
    );
    console.log(
      `   ➡️ Rewards after second deposit: ${rewardsAfterSecondDeposit}`
    );

    console.log(`   ➡️ Total deposited amount: ${depositInfo[0]}`);
    console.log(`   ➡️ Total shares: ${depositInfo[1]}`);

    const yearnVaultContract = await ethers.getContractAt(
      "IYearnVault",
      "0x7da96a3891add058ada2e826306d812c638d87a7"
    );

    const queryBalance = await yearnVaultContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Total shares reported by Yearn: ${queryBalance}`);
    expect(depositInfo[1], "✖️ Shares not right").to.eq(queryBalance);
  });

  it("should withdraw", async () => {
    const balanceUsdtAmount = 20000000000;
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    const yearnVaultContract = await ethers.getContractAt(
      "IYearnVault",
      "0x7da96a3891add058ada2e826306d812c638d87a7"
    );

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, balanceUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, balanceUsdtAmount);
    const depositTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, balanceUsdtAmount);
    await depositTx.wait();

    let pricePerShare = await yearnVaultContract.pricePerShare();
    console.log(`   ➡️ Price per share: ${pricePerShare}`);
    await _deposit(depositUsdtAmount);
    pricePerShare = await yearnVaultContract.pricePerShare();
    console.log(`   ➡️ Price per share: ${pricePerShare}`);
    await _deposit(depositUsdtAmount);
    pricePerShare = await yearnVaultContract.pricePerShare();
    console.log(`   ➡️ Price per share: ${pricePerShare}`);
    console.log(`   ➡️ Deposited successfuly`);

    await hre.ethers.provider.send("evm_increaseTime", [604800]);
    await hre.ethers.provider.send("evm_mine");
    console.log("   ➡️ Travelling in the future one week from now");

    let depositInfo = await yearnUsdtStrategy.recipients(
      fullHoldingContract.address
    );

    const collateralBeforeWithdraw = await usdtShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    expect(
      collateralBeforeWithdraw,
      "✖️ Collateral before withdraw not right"
    ).to.eq(balanceUsdtAmount);

    const initialShareAmount = parseFloat(depositInfo[1]);
    const toWithdraw = initialShareAmount / 2;
    console.log(`   ➡️ To withdraw: ${toWithdraw}`);

    await _withdraw(toWithdraw);

    const collateralAfterFirstWithdraw =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   ➡️ Collateral after first withdraw: ${collateralAfterFirstWithdraw}`
    );
    const balanceOfHoldingAfterFirstWithdrawal = await usdt.balanceOf(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Holding balance after 1st withdraw: ${balanceOfHoldingAfterFirstWithdrawal}`
    );

    depositInfo = await yearnUsdtStrategy.recipients(
      fullHoldingContract.address
    );
    const shareAmountAfterFirstWithdrawal = parseFloat(depositInfo[1]);
    expect(
      shareAmountAfterFirstWithdrawal,
      "✖️ Shares after first withdrawal are not right"
    ).to.eq(initialShareAmount - toWithdraw);
    console.log(
      `   ➡️ Shares after first withdrawal: ${shareAmountAfterFirstWithdrawal}`
    );

    await _withdraw(shareAmountAfterFirstWithdrawal);
    depositInfo = await yearnUsdtStrategy.recipients(
      fullHoldingContract.address
    );
    expect(parseFloat(depositInfo[1]), "✖️ Shares should be 0").to.eq(0);
    console.log(
      `   ➡️ Shares after second withdrawal: ${parseFloat(depositInfo[1])}`
    );

    const collateralAfterSecondWithdraw =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   ➡️ Collateral after second withdraw: ${collateralAfterSecondWithdraw}`
    );

    const balanceOfHolding = await usdt.balanceOf(fullHoldingContract.address);
    console.log(`   ➡️ Final holding balance: ${balanceOfHolding}`);

    const amountWithoutLoss =
      (balanceOfHolding / 10 ** 6 - 0.002 * (balanceOfHolding / 10 ** 6)) *
      10 ** 6;
    expect(
      parseFloat(balanceOfHolding),
      "✖️ Retrieved not right"
    ).to.greaterThan(amountWithoutLoss);

    expect(
      parseFloat(collateralAfterSecondWithdraw),
      "✖️ Retrieved not right"
    ).to.greaterThan(amountWithoutLoss);
  });
});

async function _withdraw(shares) {
  const withdrawTx = await fullStrategyManager
    .connect(tokensHolder)
    .claimInvestment(
      fullHoldingContract.address,
      yearnUsdtStrategy.address,
      shares,
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
  return withdrawEv.args;
}

async function _deposit(amount) {
  const investTx = await fullStrategyManager
    .connect(tokensHolder)
    .invest(USDT_ADDRESS, yearnUsdtStrategy.address, amount, EMPTY_BYTES);
  const investRc = await investTx.wait();
  const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
  const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
  const gasCostInUsd = gasCostInEth * ethVirtualPrice;
  console.log(
    `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
  );
  return ev.args;
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
  const yearnVault = await ethers.getContractAt(
    "IYearnVault",
    "0x7da96a3891add058ada2e826306d812c638d87a7"
  );

  const yearnUsdtFactory = await ethers.getContractFactory("YearnStablecoin");
  yearnUsdtStrategy = await yearnUsdtFactory
    .connect(owner)
    .deploy(yearnVault.address, fullManagerContainer.address);

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

  await fullStrategyManager
    .connect(owner)
    .addStrategy(yearnUsdtStrategy.address);

  const deployData = await fullStableManagerContract.shareRegistryInfo(
    USDT_ADDRESS
  );
  poolRegistryContract = await ethers.getContractAt(
    "ISharesRegistry",
    deployData[1]
  );
  usdtShareRegistryContract = await ethers.getContractAt(
    "ISharesRegistry",
    deployData[1]
  );

  await (await fullManager.connect(owner).whitelistToken(USDT_ADDRESS)).wait();
}
