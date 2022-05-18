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
const { EMPTY_BYTES } = require("../utils/constants");

const USDT_ADDRESS = process.env.USDT_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

const tokenIn = USDT_ADDRESS;
const tokenOut = "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811"; //aUsdt
const rewardToken = "0x4da27a545c0c5B758a6BA100e3a049001de870f5";
const lendingPool = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9";
const incentivesController = "0xd784927ff2f95ba542bfc824c8a8a98f3495f6b5";

let owner, tokensHolder, anotherTokenHolder;
let strategyManagerContract,
  fullStrategyManager,
  aaveStrategy,
  fullHoldingFactoryContract,
  fullHoldingContract,
  anotherHoldingContract;

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

/* Notes section
  Deposit cost : 0.0394253 ETH (deposit with LP)
  Withdraw cost : 0.0470175 ETH (withdraw)
  Claim cost : 0.0679193 ETH
*/

describe("AaveStablecoin - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    [owner, tokensHolder, anotherTokenHolder] = await ethers.getSigners();

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

  it("should deposit from different users and log results", async () => {
    console.log(await ethers.provider.getBlockNumber());
    const depositUsdtAmount = 20000000000;
    const investUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);
    await usdt
      .connect(binanceWallet)
      .transfer(anotherTokenHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    console.log(`   ➡️ Holding balance updated for 1st user`);

    await usdt
      .connect(anotherTokenHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    await fullHoldingFactoryContract
      .connect(anotherTokenHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    console.log(`   ➡️ Holding balance updated for 2nd user`);

    await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        investUsdtAmount,
        EMPTY_BYTES
      );
    console.log(`   ➡️ Deposit successful for 1st user`);

    await fullStrategyManager
      .connect(anotherTokenHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        investUsdtAmount,
        EMPTY_BYTES
      );
    console.log(`   ➡️ Deposit successful for 2nd user`);

    time_travel(1259200);

    const tokenOutContract = await ethers.getContractAt("IERC20", tokenOut);
    let tokenHolderShares = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );
    let anotherTokenHolderShares = await tokenOutContract.balanceOf(
      anotherHoldingContract.address
    );

    const recipientInfo = await aaveStrategy.recipients(
      fullHoldingContract.address
    );
    console.log(`     Shares reported by recipients: ${recipientInfo[0]}`);
    console.log(`     Shares reported by recipients: ${recipientInfo[1]}`);
    console.log(`     Shares reported by tokenOut  : ${tokenHolderShares}`);
    const claim1Tx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        aaveStrategy.address,
        tokenHolderShares,
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    await claim1Tx.wait();
    console.log(`   ➡️ Withdrawn for 1st user`);

    const claim2Tx = await fullStrategyManager
      .connect(anotherTokenHolder)
      .claimInvestment(
        anotherHoldingContract.address,
        aaveStrategy.address,
        anotherTokenHolderShares,
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    await claim2Tx.wait();
    console.log(`   ➡️ Withdrawn for 2nd user`);

    let rewardInfo = await aaveStrategy.getRewards(fullHoldingContract.address);
    console.log(`   ➡️ Accrued rewards for 1st user: ${rewardInfo}`);
    expect(parseFloat(rewardInfo)).to.be.greaterThan(0);

    rewardInfo = await aaveStrategy.getRewards(anotherHoldingContract.address);
    console.log(`   ➡️ Accrued rewards for 2nd user: ${rewardInfo}`);
    expect(parseFloat(rewardInfo)).to.be.greaterThan(0);

    await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(aaveStrategy.address, EMPTY_BYTES);
    console.log(`   ➡️ Claim rewards for 1st user`);

    await fullStrategyManager
      .connect(anotherTokenHolder)
      .claimRewards(aaveStrategy.address, EMPTY_BYTES);
    console.log(`   ➡️ Claim rewards for 2nd user`);
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardToken
    );
    let rewardBalance = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Reward balance for 1st user: ${rewardBalance}`);
    expect(parseFloat(rewardBalance)).to.be.greaterThan(0);

    rewardBalance = await rewardTokenContract.balanceOf(
      anotherHoldingContract.address
    );
    console.log(`   ➡️ Reward balance for 2nd user: ${rewardBalance}`);
    expect(parseFloat(rewardBalance)).to.be.greaterThan(0);

    time_travel(1259200);

    tokenHolderShares = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Left shares for 1st user: ${tokenHolderShares}`);

    anotherTokenHolderShares = await tokenOutContract.balanceOf(
      anotherHoldingContract.address
    );
    console.log(`   ➡️ Left shares for 2nd user: ${anotherTokenHolderShares}`);

    rewardInfo = await aaveStrategy.getRewards(fullHoldingContract.address);
    console.log(`   ➡️ Accrued rewards for 1st user: ${rewardInfo}`);

    rewardInfo = await aaveStrategy.getRewards(anotherHoldingContract.address);
    console.log(`   ➡️ Accrued rewards for 2nd user: ${rewardInfo}`);
  });

  it("should deposit", async () => {
    const depositUsdtAmount = 20000000000;
    const investUsdtAmount = 10000000000;
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

    let investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        investUsdtAmount,
        EMPTY_BYTES
      );
    let investRc = await investTx.wait();
    let ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    let gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    let gasCostInUsd = gasCostInEth * ethVirtualPrice;
    let [evSender, evToken, evStrategy, evAmount, evResult] = ev.args;

    console.log(
      `   ➡️ Invest cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        investUsdtAmount,
        EMPTY_BYTES
      );
    investRc = await investTx.wait();
    ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    gasCostInUsd = gasCostInEth * ethVirtualPrice;
    [evSender, evToken, evStrategy, evAmount, evResult] = ev.args;

    console.log(
      `   ➡️ Invest cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const tokenOutContract = await ethers.getContractAt("IERC20", tokenOut);

    const strategyATokenBalance = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );

    console.log(`   ➡️ aTokens holding balance : ${strategyATokenBalance} `);
  });

  // Skipping this one because of the Aave bug
  it.skip("should withdraw", async () => {
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

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        depositUsdtAmount,
        EMPTY_BYTES
      );
    await investTx.wait();

    const tokenOutContract = await ethers.getContractAt("IERC20", tokenOut);
    const strategyATokenBalance = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Deposited`);

    time_travel(259200);

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        aaveStrategy.address,
        strategyATokenBalance,
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    const withdrawRc = await withdrawTx.wait();
    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );
  });

  it("should deposit twice and check rewards", async () => {
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardToken
    );

    const depositUsdtAmount = 20000000000;
    const investUsdtAmount = 10000000000;
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
    let investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        investUsdtAmount,
        EMPTY_BYTES
      );
    await investTx.wait();
    console.log(`   ➡️ Deposited 1st`);

    time_travel(1259200);

    let rewardBalanceOfTheStrategy = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    let rewardInfo = await aaveStrategy.getRewards(fullHoldingContract.address);
    console.log(`   ➡️ Accrued rewards for holding: ${rewardInfo}`);
    console.log(
      `   ➡️ stkAave balance of the strategy 1st: ${rewardBalanceOfTheStrategy}`
    );

    const controller = await aaveStrategy.incentivesController();
    console.log(`   ➡️ Controller address: ${controller}`);
    expect(controller.toLowerCase()).to.eq(incentivesController.toLowerCase());

    investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDT_ADDRESS,
        aaveStrategy.address,
        investUsdtAmount,
        EMPTY_BYTES
      );
    await investTx.wait();
    console.log(`   ➡️ Deposited 2nd`);
    const tokenOutContract = await ethers.getContractAt("IERC20", tokenOut);
    const totalSharesBefore = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Total shares before time travel: ${totalSharesBefore}`);

    const tokenCollateralBefore = await fullShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Total collateral before time travel: ${tokenCollateralBefore}`
    );

    time_travel(1259200);

    rewardInfo = await aaveStrategy.getRewards(fullHoldingContract.address);
    rewardBalanceOfTheStrategy = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Accrued rewards for holding: ${rewardInfo}`);
    console.log(
      `   ➡️ stkAave balance of the strategy 2nd: ${rewardBalanceOfTheStrategy}`
    );

    const totalShares = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );

    console.log(`   ➡️ Total shares after time travel: ${totalShares}`);

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        aaveStrategy.address,
        totalShares,
        USDT_ADDRESS,
        EMPTY_BYTES
      );
    await withdrawTx.wait();
    console.log(`   ➡️ Withdrawn`);

    const tokenCollateralAfter = await fullShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Total collateral after time travel: ${tokenCollateralAfter}`
    );

    const totalSharesAfterWithdraw = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Total shares after withdraw: ${totalSharesAfterWithdraw}`
    );

    rewardInfo = await aaveStrategy.getRewards(fullHoldingContract.address);
    rewardBalanceOfTheStrategy = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Accrued rewards for holding: ${rewardInfo}`);
    console.log(
      `   ➡️ stkAave balance of the strategy 2nd: ${rewardBalanceOfTheStrategy}`
    );

    const claimRewardsTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(aaveStrategy.address, EMPTY_BYTES);
    const claimRewardsRc = await claimRewardsTx.wait();
    const claimRewardsGasCostInEth =
      (claimRewardsRc.gasUsed * gweiVirtual) / 10 ** 9;
    const claimRewardsGasCostInUsd = claimRewardsGasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Claim rewards cost : ${claimRewardsGasCostInEth} ETH or ${claimRewardsGasCostInUsd} USD`
    );

    const rewardBalanceOfTokenHolder = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    const feeAddr = await fullManager.feeAddress();
    const rewardBalanceOfFeeAddress = await rewardTokenContract.balanceOf(
      feeAddr
    );

    strategyATokenBalance = await tokenOutContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ strategy aToken balance: ${strategyATokenBalance}`);

    let holdingTokenBalance = await usdt.balanceOf(fullHoldingContract.address);
    expect(
      parseFloat(holdingTokenBalance),
      "✖️ Holding final balance not right"
    ).to.be.greaterThan(0);

    rewardInfo = await aaveStrategy.getRewards(fullHoldingContract.address);
    console.log(`   ➡️ Accrued rewards for holding : ${rewardInfo}`);
    rewardBalanceOfTheStrategy = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );

    console.log(
      `   ➡️ reward balance of the investor: ${rewardBalanceOfTheStrategy}`
    );
    console.log(
      `   ➡️ reward balance of the fee addr: ${rewardBalanceOfFeeAddress}`
    );

    expect(
      parseFloat(rewardBalanceOfTokenHolder),
      "✖️ Holding contract should have rewards"
    ).to.greaterThan(0);
  });
});

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
  ] = await deploy_basic_contracts(owner, tokenIn, data, EMPTY_BYTES);

  const aaveFactory = await ethers.getContractFactory("AaveStablecoin");
  aaveStrategy = await aaveFactory
    .connect(owner)
    .deploy(
      fullManagerContainer.address,
      lendingPool,
      incentivesController,
      tokenIn,
      tokenOut
    );

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

  await fullHoldingFactoryContract
    .connect(anotherTokenHolder)
    .createHoldingForMyself();

  const anotherHoldingAddr = await fullHoldingFactoryContract.userHolding(
    anotherTokenHolder.address
  );
  anotherHoldingContract = await ethers.getContractAt(
    "IHolding",
    anotherHoldingAddr
  );

  await (
    await fullStrategyManager.connect(owner).addStrategy(aaveStrategy.address)
  ).wait();

  await (await fullManager.connect(owner).whitelistToken(USDT_ADDRESS)).wait();
}
