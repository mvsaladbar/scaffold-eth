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

const curvePool = "0x3993d34e7e99Abf6B6f367309975d1360222D446";
const curvePoolToken = "0xc4ad29ba4b3c580e6d59105fff484999997675ff";
const curveMinter = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0";
const tricryptoGauge = "0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168";
const tricryptoVault = "0x3993d34e7e99Abf6B6f367309975d1360222D446";
const tokenIn = "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff";
const tokenOut = EMPTY_ADDRESS;
const rewardToken = "0xd533a949740bb3306d119cc777fa900ba034cd52";

let owner, tokensHolder;
let strategyManagerContract,
  fullStrategyManager,
  fullGetterContract,
  tricryptoStrategy,
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
  Deposit & wrap cost : 0.0989646 ETH  (deposit with underlying)
  Deposit cost : 0.0544373 ETH (deposit with LP)
  Withdraw cost : 0.0779296 ETH (withdraw and unwrap)
  Withdraw cost : 0.0454462 ETH (withdraw)
  Claim cost : 0.055253 ETH
*/

describe("CurveTricrypto - Tests mainnet fork", async () => {
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
    const savedManagerContainer = await tricryptoStrategy.managerContainer();
    const savedTokenIn = await tricryptoStrategy.tokenIn();
    const savedTokenOut = await tricryptoStrategy.tokenOut();
    const savedTricryptoGauge = await tricryptoStrategy.lpGauge();
    const savedTricryptoVault = await tricryptoStrategy.lpVault();
    const savedMinter = await tricryptoStrategy.curveMinter();
    const savedGetter = await tricryptoStrategy.curveLPGetter();

    expect(
      savedManagerContainer.toLowerCase(),
      "✖️ ManagerContainer not right"
    ).to.eq(fullManagerContainer.address.toLowerCase());

    expect(savedTricryptoGauge.toLowerCase(), "✖️ Gauge not right").to.eq(
      tricryptoGauge.toLowerCase()
    );

    expect(savedTricryptoVault.toLowerCase(), "✖️ Vault not right").to.eq(
      tricryptoVault.toLowerCase()
    );

    expect(savedGetter.toLowerCase(), "✖️ LP Getter not right").to.eq(
      fullGetterContract.address.toLowerCase()
    );

    expect(savedTokenIn.toLowerCase(), "✖️ Token In not right").to.eq(
      tokenIn.toLowerCase()
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
      .approve(tricryptoStrategy.address, lpBalance);

    await lpContract
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, lpBalance);
    const depositIntoHoldingTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(tokenIn, lpBalance);
    await depositIntoHoldingTx.wait();
    console.log(`   ➡️ Added the LPs to the holding`);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        lpContract.address,
        tricryptoStrategy.address,
        lpBalance,
        EMPTY_BYTES
      );
    const investRc = await investTx.wait();
    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    let [evHolding, evUser, evToken, evStrategy, evAmount, evResult] = ev.args;

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
      tricryptoStrategy.address.toLowerCase()
    );

    expect(parseFloat(evAmount), "✖️ Deposit amount not right").to.eq(
      parseFloat(lpBalance)
    );
    expect(parseFloat(evResult), "✖️ Deposit result not right").to.eq(
      parseFloat(lpBalance)
    );

    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const depositInfo = await tricryptoStrategy.recipients(
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
      .deposit(tokenIn, lpBalance);
    await depositIntoHoldingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        lpContract.address,
        tricryptoStrategy.address,
        lpBalance,
        EMPTY_BYTES
      );
    await investTx.wait();

    time_travel(459200);

    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardToken
    );
    const rewardsBeforeSecondDeposit = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
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
      .deposit(tokenIn, lpBalance);

    await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        lpContract.address,
        tricryptoStrategy.address,
        lpBalance,
        EMPTY_BYTES
      );

    const rewardsAfterSecondDeposit = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(
      `   ➡️ Holding Rewards (2nd deposit)  ${rewardsAfterSecondDeposit}`
    );

    expect(
      parseFloat(rewardsAfterSecondDeposit),
      "✖️ Rewards should be 0"
    ).to.eq(0);

    const rewardTokenBalance = await rewardTokenContract.balanceOf(
      tricryptoStrategy.address
    );
    console.log(`   ➡️ Reward's strategy token balance  ${rewardTokenBalance}`);
    expect(
      parseFloat(rewardsAfterSecondDeposit),
      "✖️ Rewards shouldn't have been claimed"
    ).to.eq(0);

    const registeredRewards = await tricryptoStrategy
      .connect(tokensHolder)
      .callStatic.getRewardsNonView(fullHoldingContract.address);
    console.log(`   ➡️ Registered rewards ${registeredRewards}`);

    expect(
      parseFloat(registeredRewards),
      "✖️ Rewards identified for holding"
    ).to.be.greaterThan(0);
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
      .deposit(tokenIn, lpBalance);
    await depositIntoHoldingTx.wait();

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        lpContract.address,
        tricryptoStrategy.address,
        lpBalance,
        EMPTY_BYTES
      );
    await investTx.wait();

    console.log(`   ➡️ Deposited ${lpBalance}`);

    time_travel(459200);

    const withdrawTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        fullHoldingContract.address,
        tricryptoStrategy.address,
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

    const rewardTokenAddress = await tricryptoStrategy.rewardToken();
    const rewardTokenContract = await ethers.getContractAt(
      "IERC20",
      rewardTokenAddress
    );
    const rewardTokenBalance = await rewardTokenContract.balanceOf(
      fullHoldingContract.address
    );
    const strategyRewardTokenBalance = await rewardTokenContract.balanceOf(
      tricryptoStrategy.address
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
        .invest(
          USDT_ADDRESS,
          tricryptoStrategy.address,
          depositUsdtAmount,
          data
        )
    ).to.revertedWith("3001");

    const addUnderlyingTx = await tricryptoStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();
    console.log(`   ➡️ Added underlying`);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDT_ADDRESS, tricryptoStrategy.address, depositUsdtAmount, data);
    const investRc = await investTx.wait();
    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const gasCostInEth = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;

    let [evHolding, evUser, evToken, evStrategy, evAmount, evResult] = ev.args;

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
      tricryptoStrategy.address.toLowerCase()
    );

    expect(parseFloat(evAmount), "✖️ Deposit amount not right").to.eq(
      parseFloat(depositUsdtAmount)
    );

    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    const depositInfo = await tricryptoStrategy.recipients(
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
    const addUnderlyingTx = await tricryptoStrategy.addUnderlying(USDT_ADDRESS);
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
      .invest(USDT_ADDRESS, tricryptoStrategy.address, depositUsdtAmount, data);
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
      await tricryptoStrategy.recipients(fullHoldingContract.address)
    )[0];
    const shares = (
      await tricryptoStrategy.recipients(fullHoldingContract.address)
    )[1];
    console.log(`   ➡️ LP shares   : ${shares} `);
    console.log(`   ➡️ Investment : ${investment} `);

    const rewardToken = await tricryptoStrategy.rewardToken();
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
        tricryptoStrategy.address,
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

    const rewardsIdentifiedByPool = await tricryptoStrategy
      .connect(tokensHolder)
      .callStatic.getRewardsNonView(fullHoldingContract.address);
    console.log(`   Amount RewardToken identified: ${rewardsIdentifiedByPool}`);
    const claimTx = await fullStrategyManager
      .connect(tokensHolder)
      .claimRewards(tricryptoStrategy.address, EMPTY_BYTES);
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
  ] = await deploy_basic_contracts(owner, tokenIn, data, EMPTY_BYTES);

  const getterFactory = await ethers.getContractFactory(
    "CurveTricryptoLPGetter"
  );
  fullGetterContract = await getterFactory.connect(owner).deploy(curvePool);

  const curveTricryptoFactory = await ethers.getContractFactory(
    "CurveTricrypto"
  );
  tricryptoStrategy = await curveTricryptoFactory
    .connect(owner)
    .deploy(
      tricryptoVault,
      tricryptoGauge,
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

  await (
    await fullStrategyManager
      .connect(owner)
      .addStrategy(tricryptoStrategy.address)
  ).wait();

  await (await fullManager.connect(owner).whitelistToken(USDT_ADDRESS)).wait();
  await (await fullManager.connect(owner).whitelistToken(tokenIn)).wait();

  //   await (await tricryptoStrategy.setRewardToken()).wait();

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
