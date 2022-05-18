const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("../utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("../utils/impersonate_account");

const USDT_ADDRESS = process.env.USDT_ADDRESS;
const WBTC_ADDRESS = process.env.WBTC_ADDRESS;
const WETH_ADDRESS = process.env.WETH_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

const curvePool = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46";

let owner, tokensHolder;
let getterContract, fullGetterContract;

chai.use(solidity);
let expect = chai.expect;

describe("CurveTricryptoLPGetter - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    [owner, tokensHolder] = await ethers.getSigners();

    await mockContracts();
    getterContract = await ethers.getContractAt(
      "ICurveTricryptoLPGetter",
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
      "ICurveTricryptoLiquidityPool",
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

  it("should add liquidity with wbtc", async () => {
    const depositWbtcAmount = 100000000;
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const wbtc = await ethers.getContractAt("IERC20", WBTC_ADDRESS);
    await wbtc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositWbtcAmount);

    await wbtc
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositWbtcAmount);

    expect(WBTC_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.WBTC()).toLowerCase()
    );

    const addLiquidityWbtcTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityWbtc(depositWbtcAmount, 0);
    const addLiquidityWbtcRc = await addLiquidityWbtcTx.wait();
    const ev = addLiquidityWbtcRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      WBTC_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositWbtcAmount)
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

  it("should add liquidity with weth", async () => {
    const depositWethAmount = ethers.utils.parseEther("1");
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS);
    await weth
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositWethAmount);

    await weth
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositWethAmount);

    expect(WETH_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.WETH()).toLowerCase()
    );

    const addLiquidityWethTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityWeth(depositWethAmount, 0);
    const addLiquidityWethRc = await addLiquidityWethTx.wait();
    const ev = addLiquidityWethRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      WETH_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositWethAmount)
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

  it("should remove liquidity weth", async () => {
    const depositWethAmount = ethers.utils.parseEther("1");
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS);
    await weth
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositWethAmount);

    await weth
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositWethAmount);

    expect(WETH_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.WETH()).toLowerCase()
    );

    const addLiquidityWethTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityWeth(depositWethAmount, 0);
    const addLiquidityWethRc = await addLiquidityWethTx.wait();
    const ev = addLiquidityWethRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      WETH_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositWethAmount)
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
      .removeLiquidityWeth(lpBalance, 0);
    const removeLiquidityRc = await removeLiquidityTx.wait();
    const removeEv = removeLiquidityRc.events.find(
      (evInfo) => evInfo.event == "RemovedLiquidity"
    );
    const [removedEvTokenIn, removedEvShareAmount, removedEvObtainedAsset] =
      removeEv.args;

    console.log(`   ➡️ Removed liquidity`);
    expect(removedEvTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      WETH_ADDRESS.toLowerCase()
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

  it("should remove liquidity weth", async () => {
    const depositWethAmount = ethers.utils.parseEther("1");
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS);
    await weth
      .connect(binanceWallet)
      .transfer(tokensHolder.address, depositWethAmount);

    await weth
      .connect(tokensHolder)
      .approve(fullGetterContract.address, depositWethAmount);

    expect(WETH_ADDRESS.toLowerCase()).to.eq(
      (await getterContract.WETH()).toLowerCase()
    );

    const addLiquidityWethTx = await getterContract
      .connect(tokensHolder)
      .addLiquidityWeth(depositWethAmount, 0);
    const addLiquidityWethRc = await addLiquidityWethTx.wait();
    const ev = addLiquidityWethRc.events.find(
      (evInfo) => evInfo.event == "AddedLiquidity"
    );
    const [evTokenIn, evTokenAmount, evObtainedLp] = ev.args;
    expect(evTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      WETH_ADDRESS.toLowerCase()
    );
    expect(parseFloat(evTokenAmount), "✖️ Amount not right").to.eq(
      parseFloat(depositWethAmount)
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
      .removeLiquidityWeth(lpBalance, 0);
    const removeLiquidityRc = await removeLiquidityTx.wait();
    const removeEv = removeLiquidityRc.events.find(
      (evInfo) => evInfo.event == "RemovedLiquidity"
    );
    const [removedEvTokenIn, removedEvShareAmount, removedEvObtainedAsset] =
      removeEv.args;

    console.log(`   ➡️ Removed liquidity`);
    expect(removedEvTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      WETH_ADDRESS.toLowerCase()
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
    "CurveTricryptoLPGetter"
  );
  fullGetterContract = await getterFactory.connect(owner).deploy(curvePool);
}
