const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");
const { inputToConfig } = require("@ethereum-waffle/compiler");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const USDT_ADDRESS = process.env.USDT_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

const convexBooster = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
const convexRewardPool = "0x8B55351ea358e5Eda371575B031ee24F462d503e";
const pid = 1;
const curvePool = "0xac795D2c97e60DF6a99ff1c814727302fD747a80";
const convexTokenIn = "0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23";
const convexTokenOut = "0xA1c3492b71938E144ad8bE4c2fB6810b01A43dD8";
const convexClaimZap = "0xDd49A93FDcae579AE50B4b9923325e9e335ec82B";

let owner, tokensHolder;
let fullStrategyManager,
  fullGetterContract,
  convexStrategy,
  yearnUsdtStrategy,
  fullHoldingFactoryContract,
  fullHoldingContract,
  usdtShareRegistryContract,
  convexTokenInRegistryContract;

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

describe("moveInvestment - Tests mainnet fork", async () => {
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
    //YearnUsdt
    console.log("YearnUsdt");
    const yearnTokenIn = await yearnUsdtStrategy.tokenIn();
    const yearnVault = await yearnUsdtStrategy.yearnVault();
    const managerContainer = await yearnUsdtStrategy.managerContainer();
    expect(yearnTokenIn.toLowerCase(), "✖️ Token not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );
    expect(yearnVault.toLowerCase(), "✖️ Vault not right").to.eq(
      "0x7da96a3891add058ada2e826306d812c638d87a7".toLowerCase()
    );
    expect(
      managerContainer.toLowerCase(),
      "✖️ ManagerContainer not right"
    ).to.eq(fullManagerContainer.address.toLowerCase());

    //Convex
    console.log("Convex");
    const savedConvexBooster = await convexStrategy.convexBooster();
    const savedRewardPool = await convexStrategy.convexBaseRewardPool();
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

    expect(savedLPGetter.toLowerCase(), "✖️ LP Getter not right").to.eq(
      fullGetterContract.address.toLowerCase()
    );

    expect(parseFloat(savedPid), "✖️ Pid not right").to.eq(parseFloat(pid));

    expect(savedTokenIn.toLowerCase(), "✖️ Token In not right").to.eq(
      convexTokenIn.toLowerCase()
    );

    expect(savedTokenOut.toLowerCase(), "✖️ Token Out not right").to.eq(
      convexTokenOut.toLowerCase()
    );
  });

  it("should test get rewards for non-participant", async () => {
    const result = await yearnUsdtStrategy.getRewards(tokensHolder.address);
    expect(result, "✖️ Rewards not right").to.eq(0);
  });

  it("should invest in yearn and then move into convex", async () => {
    // binanceWallet => tokensHolder => Holding => yearn => convex
    const depositUsdtAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdtAmount);
    console.log(`   ➡️ Got USDT`);

    await usdt
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, depositUsdtAmount);
    const depositTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, depositUsdtAmount);
    await depositTx.wait();
    console.log(`   ➡️ Holding balance updated`);

    const usdcCollateralBefore = await usdtShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   USDT collateral before: ${usdcCollateralBefore}`);
    expect(
      parseFloat(usdcCollateralBefore),
      "Invalid USDT before collateral"
    ).to.eq(depositUsdtAmount);

    let b;
    b = await usdt.balanceOf(fullHoldingContract.address);
    console.log(`   balance PRE invest: ${b}`);
    let [evHolding, evSender, evToken, evStrategy, evAmount, evResult] =
      await _investYearn(depositUsdtAmount);
    console.log(`   ➡️ Invested USDT in yearn successfuly`);

    b = await usdt.balanceOf(fullHoldingContract.address);
    console.log(`   balance POST invest: ${b}`);

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

    const depositInfo = await yearnUsdtStrategy.recipients(
      fullHoldingContract.address
    );

    const shares = depositInfo[1];

    console.log(`   ➡️ Total deposited amount: ${depositInfo[0]}`);
    console.log(`   ➡️ Total shares: ${shares}`);

    const yearnVaultContract = await ethers.getContractAt(
      "IYearnVault",
      "0x7da96a3891add058ada2e826306d812c638d87a7"
    );

    const queryBalance = await yearnVaultContract.balanceOf(
      fullHoldingContract.address
    );
    console.log(`   ➡️ Total shares reported by Yearn: ${queryBalance}`);
    expect(shares, "✖️ Shares not right").to.eq(queryBalance);

    console.log("   Moving investment into Convex");

    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [ethers.utils.parseEther("0.00000000001")]
    );

    const addUnderlyingTx = await convexStrategy.addUnderlying(USDT_ADDRESS);
    await addUnderlyingTx.wait();

    const moveInvestmentData = {
      strategyFrom: yearnUsdtStrategy.address,
      strategyTo: convexStrategy.address,
      shares: shares,
      dataFrom: EMPTY_BYTES,
      dataTo: data,
    };

    let moveInvestmentTx = fullStrategyManager
      .connect(tokensHolder)
      .moveInvestment(USDT_ADDRESS, moveInvestmentData);
    await expect(moveInvestmentTx).to.emit(
      fullStrategyManager,
      "InvestmentMoved"
    );
    moveInvestmentTx = await moveInvestmentTx;
    moveInvestmentRc = await moveInvestmentTx.wait();

    const gasCostInEth = (moveInvestmentRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ moveInvest cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );
    const ev = moveInvestmentRc.events.find(
      (evInfo) => evInfo.event == "InvestmentMoved"
    );
    let [
      evMoveHolding,
      evMoveUser,
      evMoveToken,
      evMoveStrategyFrom,
      evMoveStrategyTo,
      evMoveShares,
      evMoveResult,
    ] = ev.args;

    expect(evMoveHolding.toLowerCase()).to.eq(
      fullHoldingContract.address.toLowerCase(),
      "Invalid event holding"
    );
    expect(evMoveUser.toLowerCase()).to.eq(
      tokensHolder.address.toLowerCase(),
      "Invalid event user"
    );
    expect(evMoveToken.toLowerCase()).to.eq(
      USDT_ADDRESS.toLowerCase(),
      "Invalid event token"
    );
    expect(evMoveStrategyFrom.toLowerCase()).to.eq(
      yearnUsdtStrategy.address.toLowerCase(),
      "Invalid event strategyFrom"
    );
    expect(evMoveStrategyTo.toLowerCase()).to.eq(
      convexStrategy.address.toLowerCase(),
      "Invalid event strategyTo"
    );
    expect(evMoveShares).to.eq(shares, "Invalid event shares");
    console.log(
      `   ➡️ Moved ${shares} from yearn to ${evMoveResult} in Convex`
    );

    const usdtCollateralAfter = await usdtShareRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   USDT collateral after: ${usdtCollateralAfter}`);
    expect(
      parseFloat(usdtCollateralAfter),
      "Invalid USDT after collateral"
    ).to.be.lessThan(depositUsdtAmount);

    const convexInCollateral = await convexTokenInRegistryContract.collateral(
      fullHoldingContract.address
    );
    console.log(`   Convex token in collateral after: ${convexInCollateral}`);

    // IERC20 _token,
    //     uint256 _amount,
    //     bool _roundUp
    const testToShareForUsdc = await fullStableManagerContract.toShare(
      USDC_ADDRESS,
      10000000000,
      true
    );
    const testToAmountForUsdc = await fullStableManagerContract.toAmount(
      USDC_ADDRESS,
      10000000000,
      true
    );

    console.log(`   To share UDSC: ${testToShareForUsdc}`);
    console.log(`   To amount UDSC: ${testToAmountForUsdc}`);
    const tokenIn = await convexStrategy.tokenIn();
    const testToShareForConvexTokenIn = await fullStableManagerContract.toShare(
      tokenIn,
      ethers.utils.parseEther("1"),
      true
    );
    const testToAmountForConvexTokenIn =
      await fullStableManagerContract.toAmount(
        tokenIn,
        ethers.utils.parseEther("1"),
        true
      );
    console.log(`   To share Convex token in: ${testToShareForConvexTokenIn}`);
    console.log(
      `   To amount Convex token in: ${testToAmountForConvexTokenIn}`
    );
  });
});

async function _investYearn(amount) {
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
  ] = await deploy_basic_contracts(owner, USDC_ADDRESS, data, EMPTY_BYTES);

  const yearnVault = await ethers.getContractAt(
    "IYearnVault",
    "0x7da96a3891add058ada2e826306d812c638d87a7"
  );

  const yearnUsdtFactory = await ethers.getContractFactory("YearnStablecoin");
  yearnUsdtStrategy = await yearnUsdtFactory
    .connect(owner)
    .deploy(yearnVault.address, fullManagerContainer.address);

  const convexBoosterContract = await ethers.getContractAt(
    "IConvexBooster",
    convexBooster
  );

  const getterFactory = await ethers.getContractFactory(
    "CurveDaiUsdcUsdtLPGetter"
  );
  fullGetterContract = await getterFactory.connect(owner).deploy(curvePool);

  const convexDaiUsdcUsdtFactory = await ethers.getContractFactory(
    "ConvexDaiUsdcUsdt"
  );
  convexStrategy = await convexDaiUsdcUsdtFactory
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
    await fullStrategyManager
      .connect(owner)
      .addStrategy(yearnUsdtStrategy.address)
  ).wait();

  await (
    await fullStrategyManager.connect(owner).addStrategy(convexStrategy.address)
  ).wait();

  await (await fullManager.connect(owner).whitelistToken(USDT_ADDRESS)).wait();
  await (await fullManager.connect(owner).whitelistToken(convexTokenIn)).wait();

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

  convexTokenInRegistryContract = await registryFactory.connect(owner).deploy(
    owner.address,
    fullManagerContainer.address,
    convexTokenIn,
    fullOracleContract.address,
    EMPTY_BYTES, //oracle data
    data // contract data
  );

  await fullStableManagerContract.registerShareRegistry(
    convexTokenInRegistryContract.address,
    convexTokenIn
  );
}
