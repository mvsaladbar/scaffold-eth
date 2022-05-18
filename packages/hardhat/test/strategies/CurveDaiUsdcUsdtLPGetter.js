const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("../utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("../utils/impersonate_account");

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const USDT_ADDRESS = process.env.USDT_ADDRESS;
const DAI_ADDRESS = process.env.DAI_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

const curvePool = "0xac795D2c97e60DF6a99ff1c814727302fD747a80";

let owner, tokensHolder;
let getterContract, fullGetterContract;

chai.use(solidity);
let expect = chai.expect;

describe("CurveDaiUsdcUsdtLPGetter - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    [owner, tokensHolder] = await ethers.getSigners();

    await mockContracts();
    getterContract = await ethers.getContractAt(
      "ICurveDaiUsdcUsdtLPGetter",
      fullGetterContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should test token out", async () => {
    const getterTokenOut = await getterContract.tokenOut();
    const curveContract = await ethers.getContractAt(
      "ICurveDaiUsdcUsdtLiquidityPool",
      curvePool
    );
    const curveToken = await curveContract.token();
    expect(getterTokenOut.toLowerCase(), "✖️ Token out not right").to.eq(
      curveToken.toLowerCase()
    );
  });

  it("should add liquidity with usdt", async () => {
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
      (await getterContract.USDT()).toLowerCase()
    );

    const addLiquidityUsdtTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityUsdt(depositUsdtAmount, 0);
    const addLiquidityUsdtRc = await addLiquidityUsdtTx.wait();
    const ev = addLiquidityUsdtRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositUsdtAmount)
    );
    expect(parseFloat(evObtainedLp), "✖️ Obtained LP not right").to.greaterThan(
      0
    );
    console.log(`   ➡️ Obtained LP ${ethers.utils.formatEther(evObtainedLp)}`);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await getterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    expect(parseFloat(evObtainedLp), "✖️ LP amount not right").to.eq(
      parseFloat(lpBalance)
    );
  });

  it("should add liquidity with usdc", async () => {
    const depositUsdcAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdcAmount);

    await usdc
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositUsdcAmount);

    expect(USDC_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.USDC()).toLowerCase()
    );

    const addLiquidityUsdcTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityUsdc(depositUsdcAmount, 0);
    const addLiquidityUsdcRc = await addLiquidityUsdcTx.wait();
    const ev = addLiquidityUsdcRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      USDC_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositUsdcAmount)
    );
    expect(parseFloat(evObtainedLp), "✖️ Obtained LP not right").to.greaterThan(
      0
    );
    console.log(`   ➡️ Obtained LP ${ethers.utils.formatEther(evObtainedLp)}`);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await getterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    expect(parseFloat(evObtainedLp), "✖️ LP amount not right").to.eq(
      parseFloat(lpBalance)
    );
  });

  it("should add liquidity with dai", async () => {
    const depositDaiAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);
    await dai
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositDaiAmount);

    await dai
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositDaiAmount);

    expect(DAI_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.DAI()).toLowerCase()
    );

    const addLiquidityDaiTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityDai(depositDaiAmount, 0);
    const addLiquidityDaiRc = await addLiquidityDaiTx.wait();
    const ev = addLiquidityDaiRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      DAI_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositDaiAmount)
    );
    expect(parseFloat(evObtainedLp), "✖️ Obtained LP not right").to.greaterThan(
      0
    );
    console.log(`   ➡️ Obtained LP ${ethers.utils.formatEther(evObtainedLp)}`);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await getterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    expect(parseFloat(evObtainedLp), "✖️ LP amount not right").to.eq(
      parseFloat(lpBalance)
    );
  });

  it("should remove liquidity dai", async () => {
    const depositDaiAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);
    await dai
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositDaiAmount);

    await dai
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositDaiAmount);

    expect(DAI_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.DAI()).toLowerCase()
    );

    const addLiquidityDaiTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityDai(depositDaiAmount, 0);
    const addLiquidityDaiRc = await addLiquidityDaiTx.wait();
    const ev = addLiquidityDaiRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      DAI_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositDaiAmount)
    );
    expect(parseFloat(evObtainedLp), "✖️ Obtained LP not right").to.greaterThan(
      0
    );
    console.log(`   ➡️ Obtained LP ${ethers.utils.formatEther(evObtainedLp)}`);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await getterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(fullGetterContract.address, lpBalance);

    const removeLiquidityTx = await getterContract
      .connect(tokensHolder)
      .removeLiquidityDai(lpBalance, 0);
    const removeLiquidityRc = await removeLiquidityTx.wait();
    const removeEv = removeLiquidityRc.events.find(
      (evInfo) => evInfo.event == "RemovedLiquidity"
    );
    const [removedEvTokenIn, removedEvShareAmount, removedEvObtainedAsset] =
      removeEv.args;

    console.log(`   ➡️ Removed liquidity`);
    expect(removedEvTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      DAI_ADDRESS.toLowerCase()
    );
    expect(parseFloat(removedEvShareAmount), "✖️ Amount not right").to.eq(
      parseFloat(lpBalance)
    );
    expect(
      parseFloat(removedEvObtainedAsset),
      "✖️ Obtained asset not right"
    ).to.greaterThan(0);
    console.log(
      `   ➡️ Obtained asset ${ethers.utils.formatEther(removedEvObtainedAsset)}`
    );
  });

  it("should remove liquidity usdc", async () => {
    const depositUsdcAmount = 10000000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositUsdcAmount);

    await usdc
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositUsdcAmount);

    expect(USDC_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.USDC()).toLowerCase()
    );

    const addLiquidityUsdcTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityUsdc(depositUsdcAmount, 0);
    const addLiquidityUsdcRc = await addLiquidityUsdcTx.wait();
    const ev = addLiquidityUsdcRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      USDC_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositUsdcAmount)
    );
    expect(parseFloat(evObtainedLp), "✖️ Obtained LP not right").to.greaterThan(
      0
    );
    console.log(`   ➡️ Obtained LP ${ethers.utils.formatEther(evObtainedLp)}`);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await getterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);

    await lpContract
      .connect(tokensHolder)
      .approve(fullGetterContract.address, lpBalance);

    const removeLiquidityTx = await getterContract
      .connect(tokensHolder)
      .removeLiquidityUsdc(lpBalance, 0);
    const removeLiquidityRc = await removeLiquidityTx.wait();
    const removeEv = removeLiquidityRc.events.find(
      (evInfo) => evInfo.event == "RemovedLiquidity"
    );
    const [removedEvTokenIn, removedEvShareAmount, removedEvObtainedAsset] =
      removeEv.args;

    console.log(`   ➡️ Removed liquidity`);
    expect(removedEvTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      USDC_ADDRESS.toLowerCase()
    );
    expect(parseFloat(removedEvShareAmount), "✖️ Amount not right").to.eq(
      parseFloat(lpBalance)
    );
    expect(
      parseFloat(removedEvObtainedAsset),
      "✖️ Obtained asset not right"
    ).to.greaterThan(0);
    console.log(`   ➡️ Obtained asset ${removedEvObtainedAsset / (10 ^ 6)}`);
  });

  it("should remove liquidity usdt", async () => {
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
      (await getterContract.USDT()).toLowerCase()
    );

    const addLiquidityUsdtTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityUsdt(depositUsdtAmount, 0);
    const addLiquidityUsdtRc = await addLiquidityUsdtTx.wait();
    const ev = addLiquidityUsdtRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositUsdtAmount)
    );
    expect(parseFloat(evObtainedLp), "✖️ Obtained LP not right").to.greaterThan(
      0
    );
    console.log(`   ➡️ Obtained LP ${ethers.utils.formatEther(evObtainedLp)}`);

    const lpContract = await ethers.getContractAt(
      "IERC20",
      await getterContract.tokenOut()
    );
    const lpBalance = await lpContract.balanceOf(tokensHolder.address);
    await lpContract
      .connect(tokensHolder)
      .approve(fullGetterContract.address, lpBalance);

    const removeLiquidityTx = await getterContract
      .connect(tokensHolder)
      .removeLiquidityUsdt(lpBalance, 0);
    const removeLiquidityRc = await removeLiquidityTx.wait();
    const removeEv = removeLiquidityRc.events.find(
      (evInfo) => evInfo.event == "RemovedLiquidity"
    );
    const [removedEvTokenIn, removedEvShareAmount, removedEvObtainedAsset] =
      removeEv.args;

    console.log(`   ➡️ Removed liquidity`);
    expect(removedEvTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      USDT_ADDRESS.toLowerCase()
    );
    expect(parseFloat(removedEvShareAmount), "✖️ Amount not right").to.eq(
      parseFloat(lpBalance)
    );
    expect(
      parseFloat(removedEvObtainedAsset),
      "✖️ Obtained asset not right"
    ).to.greaterThan(0);
    console.log(`   ➡️ Obtained asset ${removedEvObtainedAsset / (10 ^ 6)}`);
  });
});

async function mockContracts() {
  const getterFactory = await ethers.getContractFactory(
    "CurveDaiUsdcUsdtLPGetter"
  );
  fullGetterContract = await getterFactory.connect(owner).deploy(curvePool);
}
