const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { EMPTY_ADDRESS, EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

let owner, tokensHolder;
let strategyManagerContract,
  fullStrategyManager,
  yearnUsdcStrategy,
  fullHoldingFactoryContract,
  fullHodingContract,
  fullManager;

chai.use(solidity);
let expect = chai.expect;

describe("StrategyManager - Tests mainnet fork", async () => {
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

  it("should add a strategy", async () => {
    await expect(
      strategyManagerContract
        .connect(tokensHolder)
        .addStrategy(yearnUsdcStrategy.address)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      strategyManagerContract.connect(owner).addStrategy(EMPTY_ADDRESS)
    ).to.revertedWith("3000");

    const initialWhitelistStatus = await strategyManagerContract.strategyInfo(
      yearnUsdcStrategy.address
    );
    expect(initialWhitelistStatus[2], "✖️ Strategy shouldn't be whitelisted").to
      .be.false;

    await expect(
      strategyManagerContract
        .connect(owner)
        .addStrategy(yearnUsdcStrategy.address)
    ).to.emit(strategyManagerContract, "StrategyAdded");

    await expect(
      strategyManagerContract
        .connect(owner)
        .addStrategy(yearnUsdcStrategy.address)
    ).to.revertedWith("3014");

    const currentWhitelistStatus = await strategyManagerContract.strategyInfo(
      yearnUsdcStrategy.address
    );
    expect(currentWhitelistStatus[2], "✖️ Strategy should now be whitelisted")
      .to.be.true;

    const info = await strategyManagerContract.strategyInfo(
      yearnUsdcStrategy.address
    );
    const defaultFee = parseFloat(await fullManager.performanceFee());
    expect(
      parseFloat(info[0]),
      "✖️ Strategy fee should be equal to the default one"
    ).to.eq(defaultFee);
    expect(info[1], "✖️ Strategy should be active").to.be.true;
  });

  it("should update a strategy", async () => {
    await expect(
      strategyManagerContract
        .connect(owner)
        .addStrategy(yearnUsdcStrategy.address)
    ).to.emit(strategyManagerContract, "StrategyAdded");

    await expect(
      strategyManagerContract
        .connect(tokensHolder)
        .updateStrategy(yearnUsdcStrategy.address, {
          active: true,
          performanceFee: 2000,
        })
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      strategyManagerContract.connect(owner).updateStrategy(USDC_ADDRESS, {
        active: true,
        performanceFee: 2000,
      })
    ).to.revertedWith("3029");

    await expect(
      strategyManagerContract
        .connect(owner)
        .updateStrategy(yearnUsdcStrategy.address, {
          active: true,
          performanceFee: 2000,
        })
    ).to.emit(strategyManagerContract, "StrategyUpdated");

    const info = await strategyManagerContract.strategyInfo(
      yearnUsdcStrategy.address
    );

    expect(parseFloat(info[0]), "✖️ Strategy fee should be 2000").to.eq(2000);
    expect(info[1], "✖️ Strategy should be active").to.be.true;
  });

  it("should remove a strategy", async () => {
    await expect(
      strategyManagerContract
        .connect(owner)
        .removeStrategy(yearnUsdcStrategy.address)
    ).to.revertedWith("3029");

    await expect(
      strategyManagerContract
        .connect(owner)
        .addStrategy(yearnUsdcStrategy.address)
    ).to.emit(strategyManagerContract, "StrategyAdded");

    await expect(
      strategyManagerContract
        .connect(tokensHolder)
        .removeStrategy(yearnUsdcStrategy.address)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      strategyManagerContract
        .connect(owner)
        .removeStrategy(yearnUsdcStrategy.address)
    ).to.emit(strategyManagerContract, "StrategyRemoved");
  });

  it("should invest & withdraw from a strategy", async () => {
    const usdcAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);

    await expect(
      strategyManagerContract
        .connect(tokensHolder)
        .invest(
          USDC_ADDRESS,
          yearnUsdcStrategy.address,
          usdcAmount,
          EMPTY_BYTES
        )
    ).to.revertedWith("3029");
    await expect(
      strategyManagerContract
        .connect(owner)
        .addStrategy(yearnUsdcStrategy.address)
    ).to.emit(strategyManagerContract, "StrategyAdded");

    await expect(
      strategyManagerContract
        .connect(tokensHolder)
        .invest(USDC_ADDRESS, yearnUsdcStrategy.address, 0, EMPTY_BYTES)
    ).to.revertedWith("2001");

    await expect(
      fullManager.connect(owner).whitelistToken(USDC_ADDRESS)
    ).to.emit(fullManager, "TokenWhitelisted");

    await usdc
      .connect(tokensHolder)
      .approve(fullHoldingFactoryContract.address, usdcAmount);
    const depositTx = await fullHoldingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);
    await depositTx.wait();

    const investTx = await strategyManagerContract
      .connect(tokensHolder)
      .invest(USDC_ADDRESS, yearnUsdcStrategy.address, usdcAmount, EMPTY_BYTES);

    const investRc = await investTx.wait();
    console.log(`   ➡️ Deposited successfuly`);

    const ev = investRc.events.find((evInfo) => evInfo.event == "Invested");
    const [evHolding, evSender, evToken, evStrategy, evAmount, evResult] =
      ev.args;

    expect(evSender.toLowerCase(), "✖️ Sender not right").to.eq(
      tokensHolder.address.toLowerCase()
    );

    expect(evToken.toLowerCase(), "✖️ Token not right").to.eq(
      USDC_ADDRESS.toLowerCase()
    );

    expect(evStrategy.toLowerCase(), "✖️ Strategy not right").to.eq(
      yearnUsdcStrategy.address.toLowerCase()
    );

    expect(evHolding.toLowerCase(), "✖️ Holding not right").to.eq(
      fullHodingContract.address.toLowerCase()
    );

    const balanceOfHoldingAfterDeposit = await usdc.balanceOf(
      fullHodingContract.address
    );
    expect(
      balanceOfHoldingAfterDeposit,
      "✖️ Balance of holding not right"
    ).to.eq(0);

    const shares = (
      await yearnUsdcStrategy.recipients(fullHodingContract.address)
    )[1];
    const withdrawTx = await strategyManagerContract
      .connect(tokensHolder)
      .claimInvestment(
        fullHodingContract.address,
        yearnUsdcStrategy.address,
        shares,
        USDC_ADDRESS,
        EMPTY_BYTES
      );
    const withdrawRc = await withdrawTx.wait();

    const withdrawEv = withdrawRc.events.find(
      (evInfo) => evInfo.event == "StrategyClaim"
    );
    const [
      withdrawEvHolding,
      withdrawEvSender,
      withdrawEvToken,
      withdrawEvStrategy,
      withdrawEvAmount,
      withdrawEvResult,
    ] = withdrawEv.args;

    expect(
      withdrawEvHolding.toLowerCase(),
      "✖️ Holding not right when withdrawing"
    ).to.eq(fullHodingContract.address.toLowerCase());

    expect(
      withdrawEvSender.toLowerCase(),
      "✖️ Sender not right when withdrawing"
    ).to.eq(tokensHolder.address.toLowerCase());

    expect(
      withdrawEvToken.toLowerCase(),
      "✖️ Token not right when withdrawing"
    ).to.eq(USDC_ADDRESS.toLowerCase());

    expect(
      withdrawEvStrategy.toLowerCase(),
      "✖️ Strategy not right when withdrawing"
    ).to.eq(yearnUsdcStrategy.address.toLowerCase());
    console.log(`   ➡️ Withdrawn successfuly`);

    const balanceOfHoldingAfterWithdraw = parseFloat(
      (await usdc.balanceOf(fullHodingContract.address)) / 10 ** 6
    );
    expect(
      balanceOfHoldingAfterWithdraw,
      "✖️ Balance of holding after withdraw not right"
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
  ] = await deploy_basic_contracts(owner, USDC_ADDRESS, data, EMPTY_BYTES);

  const yearnVault = await ethers.getContractAt(
    "IYearnVault",
    "0xa354f35829ae975e850e23e9615b11da1b3dc4de"
  );

  const yearnUsdcFactory = await ethers.getContractFactory("YearnStablecoin");
  yearnUsdcStrategy = await yearnUsdcFactory
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

  fullHodingContract = await ethers.getContractAt("IHolding", holdingAddress);

  const assignHoldingTx = await fullHoldingFactoryContract
    .connect(owner)
    .assignHolding(tokensHolder.address);
  await assignHoldingTx.wait();
}
