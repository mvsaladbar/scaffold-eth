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
const { EMPTY_BYTES, EMPTY_ADDRESS } = require("../utils/constants");

const USDT_ADDRESS = process.env.USDT_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

const curveLiquidityPool = "0xac795D2c97e60DF6a99ff1c814727302fD747a80";
const curvePoolToken = "0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23";
const curveMinter = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0";
const poolGauge = "0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53";
const tokenOut = EMPTY_ADDRESS;
const rewardToken = "0xd533a949740bb3306d119cc777fa900ba034cd52";

let owner, tokensHolder;
let strategyManagerContract,
  fullStrategyManager,
  fullGetterContract,
  poolStrategy,
  fullHoldingFactoryContract,
  fullHoldingContract,
  poolRegistryContract,
  rewardTokenRegistryContract,
  usdtShareRegistryContract;

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

/* Notes section
  Deposit & wrap cost : 0.1173999 ETH  (deposit with underlying)
  Deposit cost :  0.0546051 ETH (deposit with LP)
  Withdraw cost : 0.1146701 ETH (withdraw and unwrap)
  Withdraw cost : 0.0512677 ETH (withdraw)
  Claim cost : 0.0559616 ETH
*/

describe("CurveDaiUsdcUsdtPool - Tests mainnet fork", async () => {
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

  it("should test initial values", async () => {
    const savedManagerContainer = await poolStrategy.managerContainer();
    const savedTokenIn = await poolStrategy.tokenIn();
    const savedTokenOut = await poolStrategy.tokenOut();
    const savedPoolGauge = await poolStrategy.lpGauge();
    const saved3PoolVault = await poolStrategy.lpVault();
    const savedMinter = await poolStrategy.curveMinter();
    const savedGetter = await poolStrategy.curveLPGetter();

    expect(
      savedManagerContainer.toLowerCase(),
      "✖️ ManagerContainer not right"
    ).to.eq(fullManagerContainer.address.toLowerCase());

    expect(savedPoolGauge.toLowerCase(), "✖️ Gauge not right").to.eq(
      poolGauge.toLowerCase()
    );

    expect(saved3PoolVault.toLowerCase(), "✖️ Vault not right").to.eq(
      curveLiquidityPool.toLowerCase()
    );

    expect(savedGetter.toLowerCase(), "✖️ LP Getter not right").to.eq(
      fullGetterContract.address.toLowerCase()
    );

    expect(savedTokenIn.toLowerCase(), "✖️ Token In not right").to.eq(
      curvePoolToken.toLowerCase()
    );

    expect(savedTokenOut.toLowerCase(), "✖️ Token Out not right").to.eq(
      tokenOut.toLowerCase()
    );

    expect(savedMinter.toLowerCase(), "✖️ Minter not right").to.eq(
      curveMinter.toLowerCase()
    );
  });

  it("should test deposit with LP", async () => {
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositUsdtAmount);

    expect(USDT_ADDRESS.toLowerCase()).to.eq(
      (await fullGetterContract.USDT()).toLowerCase()
    );

    const addLiquidityUsdtTx = await fullGetterContract
      .connect(tokensHolder)
      .addLiquidityUsdt(depositUsdtAmount, 0);
    await addLiquidityUsdtTx.wait();

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await fullGetterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    console.log(`   ➡️ Got LP: ${ethers.utils.formatEther(lpBalance)}`);

    await lpContract
      .connect(tokensHolder)
      .approve(poolStrategy.address, lpBalance);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(curvePoolToken, lpBalance);
    await depositIntoHoldingTx.wait();
    console.log(`   ➡️ Added the LPs to the holding`);

    const lpCollateralBefore = await poolRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Collateral LP before: ${lpCollateralBefore}`);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(lpContract.address, poolStrategy.address, lpBalance, EMPTY_BYTES);
    const investRc = await investTx.wait();
    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    let [evHolding, evUser, evToken, evStrategy, evAmount, evResult] = ev.args;
    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );
    const lpCollateralAfter = await poolRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Collateral LP after: ${lpCollateralAfter}`);
    expect(evHolding.toLowerCase(), "✖️ Holding not right").to.eq(
      fullHoldingContract.address.toLowerCase()
    );
    expect(evUser.toLowerCase(), "✖️ User not right").to.eq(
      tokensHolder.address.toLowerCase()
    );
    expect(evToken.toLowerCase(), "✖️ Deposit asset not right").to.eq(
      lpContract.address.toLowerCase()
    );
    expect(evStrategy.toLowerCase(), "✖️ Strategy not right").to.eq(
      poolStrategy.address.toLowerCase()
    );

    expect(parseFloat(evAmount), "✖️ Deposit amount not right").to.eq(
      parseFloat(lpBalance)
    );
    expect(parseFloat(evResult), "✖️ Deposit result not right").to.eq(
      parseFloat(lpBalance)
    );

    expect(parseFloat(lpCollateralAfter), "✖️ Collateral not right").to.eq(
      parseFloat(lpCollateralBefore)
    );

    const depositInfo = await poolStrategy.recipients(
      fullHoldingContract.address
    );

    console.log(`   ➡️ Total deposited amount: ${depositInfo[0]}`);
    console.log(`   ➡️ Total shares: ${depositInfo[1]}`);
  });

  it("get rewards", async () => {
    const balanceUsdtAmount = 20000000000;
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, balanceUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositUsdtAmount);

    let addLiquidityUsdtTx = await fullGetterContract
      .connect(tokensHolder)
      .addLiquidityUsdt(depositUsdtAmount, 0);
    await addLiquidityUsdtTx.wait();

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await fullGetterContract.tokenOut()
    );
    let lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(curvePoolToken, lpBalance);
    await depositIntoHoldingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(lpContract.address, poolStrategy.address, lpBalance, EMPTY_BYTES);
    await investTx.wait();

    time_travel(459200);

    const rewardsBeforeSecondDeposit = await poolStrategy
      .connect(tokensHolder)
      .callStatic.getRewardsNonView(fullHoldingContract.address);
    console.log(
      `   ➡️ Holding Rewards (1st deposit) ${rewardsBeforeSecondDeposit}`
    );

    await usdt
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositUsdtAmount);

    addLiquidityUsdtTx = await fullGetterContract
      .connect(tokensHolder)
      .addLiquidityUsdt(depositUsdtAmount, 0);
    await addLiquidityUsdtTx.wait();

    lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);

    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(curvePoolToken, lpBalance);

    await fullStrategyManager
      .connect(tokensHolder)
      .invest(lpContract.address, poolStrategy.address, lpBalance, EMPTY_BYTES);

    const rewardsAfterSecondDeposit = await poolStrategy
      .connect(tokensHolder)
      .callStatic.getRewardsNonView(fullHoldingContract.address);
    console.log(
      `   ➡️ Holding Rewards (2nd deposit)  ${rewardsAfterSecondDeposit}`
    );

    const rewardTokenAddress = await poolStrategy.rewardToken();
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardTokenAddress
    );
    const rewardTokenBalance = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );

    console.log(
      `   ➡️ Holding balance of reward token:  ${rewardTokenBalance}`
    );
    expect(
      parseFloat(rewardTokenBalance),
      "✖️ Rewards shouldn't have been claimed"
    ).to.eq(0);
  });

  it("should withdraw", async () => {
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);

    await usdt
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositUsdtAmount);

    const addLiquidityUsdtTx = await fullGetterContract
      .connect(tokensHolder)
      .addLiquidityUsdt(depositUsdtAmount, 0);
    await addLiquidityUsdtTx.wait();

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await fullGetterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(curvePoolToken, lpBalance);
    await depositIntoHoldingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(lpContract.address, poolStrategy.address, lpBalance, EMPTY_BYTES);
    await investTx.wait();

    console.log(`   ➡️ Deposited ${lpBalance}`);

    time_travel(459200);

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        poolStrategy.address,
        lpBalance,
        lpContract.address,
        EMPTY_BYTES
      );
    const withdrawRc = await withdrawTx.wait();
    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const balanceOfLPs = await lpContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Holding balance of LP  : ${ethers.utils.formatEther(balanceOfLPs)}`
    );

    const rewardTokenAddress = await poolStrategy.rewardToken();
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardTokenAddress
    );
    const rewardTokenBalance = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    const strategyRewardTokenBalance = await rewardTokenContract.balanceOf(
      poolStrategy.address
    );
    console.log(
      `   ➡️ Holding Rewards   ${ethers.utils.formatEther(rewardTokenBalance)}`
    );
    console.log(
      `   ➡️ Strategy Rewards   ${ethers.utils.formatEther(
        strategyRewardTokenBalance
      )}`
    );

    expect(
      parseFloat(rewardTokenBalance),
      "✖️ Rewards shouldn't have been claimed"
    ).to.eq(0);
    expect(
      parseFloat(strategyRewardTokenBalance),
      "✖️ Strategy shouldn't have any rewards"
    ).to.eq(0);
  });

  it("should deposit with underlying", async () => {
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

    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [ethers.utils.parseEther("0.00000000001")]
    );

    await expect(
      fullStrategyManager
        .connect(tokensHolder)
        .invest(USDT_ADDRESS, poolStrategy.address, depositUsdtAmount, data)
    ).to.revertedWith("3001");

    const addUnderlyingTx = await poolStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();
    console.log(`   ➡️ Added underlying`);

    const usdtCollateralBefore = await usdtShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   ➡️ USDT collateral before: ${usdtCollateralBefore}`);
    const tokenInCollateralBefore = await poolRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   ➡️ TokenIn collateral before: ${tokenInCollateralBefore}`);

    expect(
      parseFloat(usdtCollateralBefore),
      "✖️ USDT collateral before not right"
    ).to.eq(parseFloat(depositUsdtAmount));

    expect(
      parseFloat(tokenInCollateralBefore),
      "✖️ TokenIn collateral before not right"
    ).to.eq(0);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, poolStrategy.address, depositUsdtAmount, data);
    const investRc = await investTx.wait();
    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    let [evHolding, evUser, evToken, evStrategy, evAmount, evResult] = ev.args;

    const usdtCollateralAfter = await usdtShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   ➡️ USDT collateral after: ${usdtCollateralAfter}`);
    const tokenInCollateralAfter = await poolRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   ➡️ TokenIn collateral after: ${tokenInCollateralAfter}`);

    expect(
      parseFloat(usdtCollateralAfter),
      "✖️ USDT collateral after not right"
    ).to.eq(0);

    expect(
      parseFloat(tokenInCollateralAfter),
      "✖️ TokenIn collateral after not right"
    ).to.be.greaterThan(0);

    expect(evHolding.toLowerCase(), "✖️ Holding not right").to.eq(
      fullHoldingContract.address.toLowerCase()
    );
    expect(evUser.toLowerCase(), "✖️ User not right").to.eq(
      tokensHolder.address.toLowerCase()
    );
    expect(evToken.toLowerCase(), "✖️ Deposit asset not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );
    expect(evStrategy.toLowerCase(), "✖️ Strategy not right").to.eq(
      poolStrategy.address.toLowerCase()
    );

    expect(parseFloat(evAmount), "✖️ Deposit amount not right").to.eq(
      parseFloat(depositUsdtAmount)
    );

    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const depositInfo = await poolStrategy.recipients(
      fullHoldingContract.address
    );

    console.log(
      `   ➡️ Total deposited amount: ${ethers.utils.formatEther(
        depositInfo[0]
      )}`
    );
    console.log(
      `   ➡️ Total shares: ${ethers.utils.formatEther(depositInfo[1])}`
    );
  });

  it("should deposit with underlying, withdraw, claim rewards and check collaterals at each step", async () => {
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

    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [ethers.utils.parseEther("0.00000000001")]
    );
    const addUnderlyingTx = await poolStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();
    console.log(`   ➡️ Added underlying`);

    const usdtCollateralBeforeDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral USDT before deposit: ${usdtCollateralBeforeDeposit}`
    );

    const tokenInCollateralBeforeDeposit =
      await poolRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral TokenIn before deposit: ${tokenInCollateralBeforeDeposit}`
    );
    expect(
      parseFloat(usdtCollateralBeforeDeposit),
      "✖️ USDT collateral before deposit not right"
    ).to.eq(parseFloat(depositUsdtAmount));
    expect(
      parseFloat(tokenInCollateralBeforeDeposit),
      "✖️ TokenIn collateral before deposit not right"
    ).to.eq(0);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, poolStrategy.address, depositUsdtAmount, data);
    const investRc = await investTx.wait();
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ Deposit & wrap cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const usdtCollateralAfterDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral USDT after deposit: ${usdtCollateralAfterDeposit}`
    );
    const tokenInCollateralAfterDeposit = await poolRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(
      `   Collateral TokenIn after deposit: ${tokenInCollateralAfterDeposit}`
    );

    expect(
      parseFloat(usdtCollateralAfterDeposit),
      "✖️ USDT collateral after deposit not right"
    ).to.eq(0);

    expect(
      parseFloat(tokenInCollateralAfterDeposit),
      "✖️ TokenIn collateral after deposit not right"
    ).to.be.greaterThan(0);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await fullGetterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(fullHoldingContract.address);
    console.log(`   ➡️ LP balance  : ${lpBalance} `);
    const investment = (
      await poolStrategy.recipients(fullHoldingContract.address)
    )[0];
    const shares = (
      await poolStrategy.recipients(fullHoldingContract.address)
    )[1];
    console.log(`   ➡️ LP shares   : ${shares} `);
    console.log(`   ➡️ Investment : ${investment} `);

    const rewardToken = await poolStrategy.rewardToken();
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardToken
    );

    const rewardTokenBalanceOfHoldingBeforeWithdraw =
      await rewardTokenContract.balanceOf(fullHoldingContract.address);
    console.log(
      `   Balance RewardToken before withdraw: ${rewardTokenBalanceOfHoldingBeforeWithdraw}`
    );

    const withdrawData = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [ethers.utils.parseEther("0.00000000001")]
    );
    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        poolStrategy.address,
        shares,
        USDT_ADDRESS,
        withdrawData
      );
    const withdrawRc = await withdrawTx.wait();

    console.log(
      `   ➡️ Withdraw cost : ${
        (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9
      } ETH `
    );

    const usdtCollateralAfterWithdraw =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral USDT after withdraw: ${usdtCollateralAfterWithdraw}`
    );
    expect(
      parseFloat(usdtCollateralAfterWithdraw),
      "✖️ USDT collateral after withdraw not right"
    ).to.be.greaterThan(0);

    const tokenInCollateralAfterWithdraw =
      await poolRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral TokenIn after withdraw: ${tokenInCollateralAfterWithdraw}`
    );
    expect(
      parseFloat(tokenInCollateralAfterWithdraw),
      "✖️ TokenIn collateral after withdraw not right"
    ).to.eq(0);

    const rewardTokenCollateralBeforeClaim =
      await rewardTokenRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral RewardToken before claim: ${rewardTokenCollateralBeforeClaim}`
    );
    expect(
      parseFloat(rewardTokenCollateralBeforeClaim),
      "✖️ RewardToken collateral before claim not right"
    ).to.eq(0);

    const rewardTokenBalanceOfHoldingBefore =
      await rewardTokenContract.balanceOf(fullHoldingContract.address);
    console.log(
      `   Balance RewardToken before: ${rewardTokenBalanceOfHoldingBefore}`
    );

    const rewardsIdentifiedByPool = await poolStrategy
      .connect(tokensHolder)
      .callStatic.getRewardsNonView(fullHoldingContract.address);
    console.log(`   Amount RewardToken identified: ${rewardsIdentifiedByPool}`);
    const claimTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(poolStrategy.address, EMPTY_BYTES);
    const claimRc = await claimTx.wait();
    console.log(
      `   ➡️ Claim cost : ${(claimRc.gasUsed * gweiVirtual) / 10 ** 9} ETH `
    );

    const rewardTokenCollateralAfterClaim =
      await rewardTokenRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral RewardToken after claim: ${rewardTokenCollateralAfterClaim}`
    );

    const rewardTokenBalanceOfHoldingAfter =
      await rewardTokenContract.balanceOf(fullHoldingContract.address);
    console.log(
      `   Balance RewardToken after: ${rewardTokenBalanceOfHoldingAfter}`
    );

    expect(
      parseFloat(rewardTokenCollateralAfterClaim),
      "✖️ RewardToken collateral after claim not right"
    ).to.be.greaterThan(0);
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
  ] = await deploy_basic_contracts(owner, curvePoolToken, data, EMPTY_BYTES);

  const getterFactory = await ethers.getContractFactory(
    "CurveDaiUsdcUsdtLPGetter"
  );
  fullGetterContract = await getterFactory
    .connect(owner)
    .deploy(curveLiquidityPool);

  const curvePoolFactory = await ethers.getContractFactory(
    "CurveDaiUsdcUsdtPool"
  );
  poolStrategy = await curvePoolFactory
    .connect(owner)
    .deploy(
      curveLiquidityPool,
      curvePoolToken,
      poolGauge,
      curveMinter,
      fullGetterContract.address,
      fullManagerContainer.address
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

  await fullStrategyManager.connect(owner).addStrategy(poolStrategy.address);

  await fullManager.connect(owner).whitelistToken(USDT_ADDRESS);
  await fullManager.connect(owner).whitelistToken(curvePoolToken);

  //deploy share registry
  const registryFactory = await ethers.getContractFactory("SharesRegistry");
  usdtShareRegistryContract = await registryFactory.connect(owner).deploy(
    owner.address,
    fullManagerContainer.address,
    USDT_ADDRESS,
    fullOracleContract.address,
    EMPTY_BYTES, //oracle data
    data // contract data
  );

  const setRegistryTx = await fullStableManagerContract.registerShareRegistry(
    usdtShareRegistryContract.address,
    USDT_ADDRESS
  );
  await setRegistryTx.wait();

  const deployData = await fullStableManagerContract.shareRegistryInfo(
    curvePoolToken
  );
  poolRegistryContract = await ethers.getContractAt(
    "ISharesRegistry",
    deployData[1]
  );

  rewardTokenRegistryContract = await registryFactory.connect(owner).deploy(
    owner.address,
    fullManagerContainer.address,
    rewardToken,
    fullOracleContract.address,
    EMPTY_BYTES, //oracle data
    data // contract data
  );
  await fullStableManagerContract.registerShareRegistry(
    rewardTokenRegistryContract.address,
    rewardToken
  );
}
