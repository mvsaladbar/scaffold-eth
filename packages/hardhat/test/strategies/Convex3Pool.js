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

const convexBooster = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
const convexRewardPool = "0x689440f2Ff927E1f24c72F1087E1FAF471eCe1c8";
const convexClaimZap = "0xDd49A93FDcae579AE50B4b9923325e9e335ec82B";

const pid = 9;
const curvePool = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";
const tokenIn = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490";
const tokenOut = "0x30D9410ED1D5DA1F6C8391af5338C93ab8d4035C";
const rewardToken = "0xd533a949740bb3306d119cc777fa900ba034cd52";
const cvxToken = "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b";

let owner, tokensHolder;
let strategyManagerContract,
  fullStrategyManager,
  fullGetterContract,
  convexStrategy,
  fullHoldingFactoryContract,
  fullHoldingContract,
  usdtShareRegistryContract,
  convex3PoolRegistryContract,
  rewardTokenRegistryContract,
  cvxPoolRegistryContract;

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

/* Notes section
  Deposit & wrap cost : 0.1027068  (deposit with underlying)
  Deposit cost : 0.0657932 ETH (deposit with LP)
  Withdraw cost : 0.0902592 ETH (withdraw and unwrap)
  Withdraw cost : 0.0571378 ETH (withdraw)
  Claim cost : 0.0123282 ETH
*/

describe("Convex3Pool - Tests mainnet fork", async () => {
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
    const savedConvexBooster = await convexStrategy.convexBooster();
    const savedRewardPool = await convexStrategy.convexBaseRewardPool();
    const savedConvexZap = await convexStrategy.convexZap();
    const savedLPGetter = await convexStrategy.lpGetter();
    const savedPid = await convexStrategy.pid();
    const savedTokenIn = await convexStrategy.tokenIn();
    const savedTokenOut = await convexStrategy.tokenOut();

    expect(
      savedConvexBooster.toLowerCase(),
      "✖️ Convex booster not right"
    ).to.eq(convexBooster.toLowerCase());

    expect(savedRewardPool.toLowerCase(), "✖️ Reward pool not right").to.eq(
      convexRewardPool.toLowerCase()
    );
    expect(savedConvexZap.toLowerCase(), "✖️ Zap not right").to.eq(
      convexClaimZap.toLowerCase()
    );
    expect(savedLPGetter.toLowerCase(), "✖️ LP Getter not right").to.eq(
      fullGetterContract.address.toLowerCase()
    );

    expect(parseFloat(savedPid), "✖️ Pid not right").to.eq(parseFloat(pid));

    expect(savedTokenIn.toLowerCase(), "✖️ Token In not right").to.eq(
      tokenIn.toLowerCase()
    );

    expect(savedTokenOut.toLowerCase(), "✖️ Token Out not right").to.eq(
      tokenOut.toLowerCase()
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
    const addUnderlyingTx = await convexStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();
    console.log(`   ➡️ Added underlying`);

    const usdtCollateralBeforeDeposit =
      await usdtShareRegistryContract.collateral(fullHoldingContract.address);
    console.log(
      `   Collateral USDT before deposit: ${usdtCollateralBeforeDeposit}`
    );

    const tokenInCollateralBeforeDeposit =
      await convex3PoolRegistryContract.collateral(fullHoldingContract.address);
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
      .invest(USDT_ADDRESS, convexStrategy.address, depositUsdtAmount, data);
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
    const tokenInCollateralAfterDeposit =
      await convex3PoolRegistryContract.collateral(fullHoldingContract.address);
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

    const convexRewardPoolContract = await ethers.getContractAt(
      "IConvexBaseRewardPool",
      convexRewardPool
    );
    const shareAmount = await convexRewardPoolContract.balanceOf(
      fullHoldingContract.address
    );
    const rewardToken = await convexStrategy.rewardToken();
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
        convexStrategy.address,
        shareAmount,
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
      await convex3PoolRegistryContract.collateral(fullHoldingContract.address);
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

    const crvTokenAddress = await convexStrategy.rewardToken();

    const abiCoder = new ethers.utils.AbiCoder();

    const extras = abiCoder.encode(
      ["uint256", "uint256", "uint256", "uint256", "uint256"],
      [0, 0, 0, 0, 0]
    );
    const claimData = abiCoder.encode(
      [
        "address[]",
        "address[]",
        "address[]",
        "address[]",
        "address[]",
        "bytes",
      ],
      [
        [convexRewardPool, convexRewardPool],
        [],
        [],
        [crvTokenAddress, "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b"],
        [],
        extras,
      ]
    );
    const claimTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(convexStrategy.address, claimData);
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

  it("should perform deposit", async () => {
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
      .addLiquidityUsdt(
        depositUsdtAmount,
        ethers.utils.parseEther("0.000000000001")
      );
    await addLiquidityUsdtTx.wait();

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await fullGetterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(convexStrategy.address, lpBalance);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(tokenIn, lpBalance);
    await depositIntoHoldingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        lpContract.address,
        convexStrategy.address,
        lpBalance,
        EMPTY_BYTES
      );
    const investRc = await investTx.wait();
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const convexRewardPoolContract = await ethers.getContractAt(
      "IConvexBaseRewardPool",
      convexRewardPool
    );

    const shareAmount = await convexRewardPoolContract.balanceOf(
      fullHoldingContract.address
    );

    const depositInfo = await convexStrategy.recipients(
      fullHoldingContract.address
    );

    console.log(`   ➡️ Total deposited amount: ${depositInfo[0]}`);
    console.log(`   ➡️ Total shares: ${depositInfo[1]}`);
    console.log(`   ➡️ Shares from reward pool: ${shareAmount}`);
    expect(parseFloat(shareAmount), "✖️ Shares not right").to.eq(
      parseFloat(depositInfo[1])
    );
  });

  it("should deposit and withdraw & unwrap", async () => {
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
    const addUnderlyingTx = await convexStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, convexStrategy.address, depositUsdtAmount, data);
    await investTx.wait();

    console.log(`   ➡️ Deposited`);

    const convexRewardPoolContract = await ethers.getContractAt(
      "IConvexBaseRewardPool",
      convexRewardPool
    );
    const shareAmount = await convexRewardPoolContract.balanceOf(
      fullHoldingContract.address
    );

    const withdrawData = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [ethers.utils.parseEther("0.00000000001")]
    );
    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        convexStrategy.address,
        shareAmount,
        USDT_ADDRESS,
        withdrawData
      );
    const withdrawRc = await withdrawTx.wait();
    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const balanceOfUsdt = await usdt.balanceOf(fullHoldingContract.address);
    console.log(`   ➡️ Holding balance of USDT  : ${balanceOfUsdt}`);
  });

  it("should get rewards", async () => {
    const balanceUsdtAmount = 20000000000;
    const depositUsdtAmount = 10000000000;
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
    console.log(`   ➡️ Deposit successful`);

    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [ethers.utils.parseEther("0.00000000001")]
    );

    const addUnderlyingTx = await convexStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();
    console.log(`   ➡️ Added underlying address`);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, convexStrategy.address, depositUsdtAmount, data);
    await investTx.wait();
    console.log(`   ➡️ Invest successful`);

    time_travel(259200);

    const crvAddress = await convexStrategy.rewardToken();
    const crvToken = await ethers.getContractAt("IERC20", crvAddress);
    const rewardPoolContract = await ethers.getContractAt(
      "IConvexBaseRewardPool",
      convexRewardPool
    );

    let crvBalanceOfStrategy = await crvToken.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ CRV balance ${crvBalanceOfStrategy}`);

    let rewards = await convexStrategy.getRewards(fullHoldingContract.address);
    let rewardsIdentifiedByPool = await rewardPoolContract.rewards(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Rewards so far the contract identified ${rewards}`);
    console.log(
      `   ➡️ Rewards so far the pool identified  ${rewardsIdentifiedByPool}`
    );

    await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, convexStrategy.address, depositUsdtAmount, data);
    console.log(`   ➡️ Invest successful`);

    crvBalanceOfStrategy = await crvToken.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ CRV balance ${crvBalanceOfStrategy}`);

    rewards = await convexStrategy.getRewards(fullHoldingContract.address);
    rewardsIdentifiedByPool = await rewardPoolContract.rewards(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Rewards so far the pool identified ${rewardsIdentifiedByPool}`
    );
    console.log(`   ➡️ Rewards so far the contract identified ${rewards}`);

    const crvTokenAddress = await convexStrategy.rewardToken();

    const abiCoder = new ethers.utils.AbiCoder();
    const extras = abiCoder.encode(
      ["uint256", "uint256", "uint256", "uint256", "uint256"],
      [0, 0, 0, 0, 0]
    );
    const claimData = abiCoder.encode(
      [
        "address[]",
        "address[]",
        "address[]",
        "address[]",
        "address[]",
        "bytes",
      ],
      [
        [convexRewardPool, convexRewardPool],
        [],
        [],
        [crvTokenAddress, "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b"],
        [],
        extras,
      ]
    );
    await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(convexStrategy.address, claimData);
    console.log(`   ➡️ Claim rewards`);

    const rewardToken = await convexStrategy.rewardToken();
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardToken
    );
    let rewardBalance = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Reward balance for user: ${rewardBalance}`);

    const feeAddr = await fullManager.feeAddress();
    let feeRewardBalance = await rewardTokenContract.balanceOf(feeAddr);
    console.log(`   ➡️ Reward balance for fee address: ${feeRewardBalance}`);

    expect(parseFloat(rewardBalance)).to.be.greaterThan(0);
    expect(parseFloat(feeRewardBalance)).to.be.greaterThan(0);

    rewards = await convexStrategy.getRewards(fullHoldingContract.address);
    rewardsIdentifiedByPool = await rewardPoolContract.rewards(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Rewards so far the pool identified ${rewardsIdentifiedByPool}`
    );
    console.log(`   ➡️ Rewards so far the contract identified ${rewards}`);

    time_travel(259200);
    console.log(`   ➡️ Advancing time a bit`);

    rewards = await convexStrategy.getRewards(fullHoldingContract.address);
    rewardsIdentifiedByPool = await rewardPoolContract.rewards(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Rewards so far the pool identified ${rewardsIdentifiedByPool}`
    );
    console.log(`   ➡️ Rewards so far the contract identified ${rewards}`);

    await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(convexStrategy.address, claimData);
    console.log(`   ➡️ Claim rewards`);

    const finalRewardBalance = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Reward balance for user: ${finalRewardBalance}`);

    const finalFeeRewardBalance = await rewardTokenContract.balanceOf(feeAddr);
    console.log(`   ➡️ Reward balance for fee : ${finalFeeRewardBalance}`);
    if (parseFloat(rewardsIdentifiedByPool) > 0) {
      expect(
        parseFloat(finalRewardBalance) - parseFloat(rewardBalance),
        "✖️ Earned rewards not right after final claim"
      ).to.be.greaterThan(0);

      expect(
        parseFloat(finalFeeRewardBalance) - parseFloat(feeRewardBalance),
        "✖️ Fee rewards not right after final claim"
      ).to.be.greaterThan(0);
    }
    const cvxTokenCtr = await ethers.getContractAt("IERC20", cvxToken);

    const cvxBalanceHolding = await cvxTokenCtr.balanceOf(
      fullHoldingContract.address
    );
    const cvxBalanceStrategyManager = await cvxTokenCtr.balanceOf(
      fullStrategyManager.address
    );
    const cvxBalanceStrategy = await cvxTokenCtr.balanceOf(
      convexStrategy.address
    );
    const cvxBalanceFeeAddress = await cvxTokenCtr.balanceOf(feeAddr);

    console.log(` Convex strategy CVX balance: ${cvxBalanceStrategy}`);
    console.log(
      ` Convex strategy manager CVX balance: ${cvxBalanceStrategyManager}`
    );
    console.log(` Convex holding CVX balance: ${cvxBalanceHolding}`);
    console.log(` Fee address CVX balance: ${cvxBalanceFeeAddress}`);

    const cvxCollateral = await cvxPoolRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(` Convex collateral: ${cvxCollateral}`);
  });

  it("should wrap and deposit", async () => {
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

    await expect(
      fullStrategyManager
        .connect(tokensHolder)
        .invest(USDT_ADDRESS, convexStrategy.address, depositUsdtAmount, data)
    ).to.revertedWith("3001");

    const addUnderlyingTx = await convexStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();
    console.log(`   ➡️ Added underlying`);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, convexStrategy.address, depositUsdtAmount, data);
    const investRc = await investTx.wait();
    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    let [evSender, evToken, evStrategy, evAmount, evResult] = ev.args;

    console.log(
      `   ➡️ Deposit & wrap cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );
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
      .addLiquidityUsdt(
        depositUsdtAmount,
        ethers.utils.parseEther("0.000000000001")
      );
    await addLiquidityUsdtTx.wait();

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await fullGetterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(convexStrategy.address, lpBalance);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(tokenIn, lpBalance);
    await depositIntoHoldingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        lpContract.address,
        convexStrategy.address,
        lpBalance,
        EMPTY_BYTES
      );
    await investTx.wait();

    console.log(`   ➡️ Deposited`);

    const convexRewardPoolContract = await ethers.getContractAt(
      "IConvexBaseRewardPool",
      convexRewardPool
    );
    const shareAmount = await convexRewardPoolContract.balanceOf(
      fullHoldingContract.address
    );

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        convexStrategy.address,
        shareAmount,
        lpContract.address,
        EMPTY_BYTES
      );
    const withdrawRc = await withdrawTx.wait();
    const withdrawEv = withdrawRc.events.find(
      (evInfo) => evInfo.event == "StrategyClaim"
    );
    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    const [
      withdrawHolding,
      withdrawSender,
      withdrawToken,
      withdrawStrategy,
      withdrawAmount,
      withdrawResult,
    ] = withdrawEv.args;

    expect(withdrawSender.toLowerCase(), "✖️ Sender not right").to.eq(
      tokensHolder.address.toLowerCase()
    );
    expect(
      withdrawToken.toLowerCase(),
      "✖️ Token in for withdrawal not right"
    ).to.eq(tokenIn.toLowerCase());
    expect(withdrawStrategy.toLowerCase(), "✖️ Strategy not right").to.eq(
      convexStrategy.address.toLowerCase()
    );
    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const holdingBalanceOfLp = await lpContract.balanceOf(
      fullHoldingContract.address
    );
    const strategyBalanceOfLp = await lpContract.balanceOf(
      convexStrategy.address
    );
    console.log(
      `   ➡️ Holding LP balance ${ethers.utils.formatEther(holdingBalanceOfLp)}`
    );
    console.log(
      `   ➡️ Strategy LP balance ${ethers.utils.formatEther(
        strategyBalanceOfLp
      )}`
    );
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

  const convexBoosterContract = await ethers.getContractAt(
    "IConvexBooster",
    convexBooster
  );

  const getterFactory = await ethers.getContractFactory("Curve3PoolLPGetter");
  fullGetterContract = await getterFactory
    .connect(owner)
    .deploy(curvePool, tokenIn);

  const convexStablecoinFactory = await ethers.getContractFactory(
    "Convex3Pool"
  );
  convexStrategy = await convexStablecoinFactory
    .connect(owner)
    .deploy(
      pid,
      convexBoosterContract.address,
      convexRewardPool,
      convexClaimZap,
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

  await (
    await fullStrategyManager.connect(owner).addStrategy(convexStrategy.address)
  ).wait();

  await (await fullManager.connect(owner).whitelistToken(USDT_ADDRESS)).wait();
  await (await fullManager.connect(owner).whitelistToken(tokenIn)).wait();

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
  await fullStableManagerContract.registerShareRegistry(
    usdtShareRegistryContract.address,
    USDT_ADDRESS
  );

  const deployData = await fullStableManagerContract.shareRegistryInfo(tokenIn);
  convex3PoolRegistryContract = await ethers.getContractAt(
    "ISharesRegistry",
    deployData[1]
  );

  cvxPoolRegistryContract = await registryFactory.connect(owner).deploy(
    owner.address,
    fullManagerContainer.address,
    cvxToken,
    fullOracleContract.address,
    EMPTY_BYTES, //oracle data
    data // contract data
  );
  await fullStableManagerContract.registerShareRegistry(
    cvxPoolRegistryContract.address,
    cvxToken
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
