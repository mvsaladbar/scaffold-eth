const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { parseEvent } = require("./utils/parse_events");
const { EMPTY_ADDRESS, EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const USDT_ADDRESS = process.env.USDT_ADDRESS;
const DAI_ADDRESS = process.env.DAI_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

let owner, tokensHolder, anotherHolder;
let holdingContract,
  anotherHoldingContract,
  usdtShareRegistryContract,
  daiShareRegistryContract;
let holdingFactoryContract,
  fullHoldingFactoryContract,
  fullManager,
  fullAaveStrategy;

let fullStableManagerContract,
  fullShareRegistryContract,
  fullOracleContract,
  fullPandoraMoneyContract;

let fullDexManagerContract, yearnUsdcStrategy;

const tokenIn = USDC_ADDRESS;
const tokenOut = "0xbcca60bb61934080951369a648fb03df4f96263c"; //aUsdc
const lendingPool = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9";
const incentivesController = "0xd784927ff2f95ba542bfc824c8a8a98f3495f6b5";

let ethVirtualPrice = 2300;
let gweiVirtual = 100;

chai.use(solidity);
let expect = chai.expect;

describe("Holding - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);

    [owner, tokensHolder, anotherHolder] = await ethers.getSigners();

    await mockContracts();
    holdingFactoryContract = await ethers.getContractAt(
      "IHoldingManager",
      fullHoldingFactoryContract.address
    );

    const createHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    const createHoldingRc = await createHoldingTx.wait();
    const ev = createHoldingRc.events.find(
      (evInfo) => evInfo.event == "HoldingCreated"
    );
    const [, holdingAddress] = ev.args;

    holdingContract = await ethers.getContractAt("IHolding", holdingAddress);

    const anotherCreateHoldingTx = await holdingFactoryContract
      .connect(tokensHolder)
      .createHolding();
    const anotherCreateHoldingRc = await anotherCreateHoldingTx.wait();
    const anotherEv = anotherCreateHoldingRc.events.find(
      (evInfo) => evInfo.event == "HoldingCreated"
    );
    const [, anotherHoldingAddress] = anotherEv.args;
    anotherHoldingContract = await ethers.getContractAt(
      "IHolding",
      anotherHoldingAddress
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });
  it("should not be assigned to anyone", async () => {
    const holdingUser = await holdingFactoryContract.holdingUser(
      holdingContract.address
    );
    const isHolding = await holdingFactoryContract.isHolding(
      holdingContract.address
    );

    expect(isHolding, "✖️ Should be valid holding").to.be.true;
    expect(holdingUser).to.be.eq(
      EMPTY_ADDRESS,
      "✖️ Holding should not belong to anyone yet"
    );
  });

  it("should test assigning a new user", async () => {
    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .assignHolding(anotherHolder.address)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      holdingFactoryContract
        .connect(owner)
        .assignHolding(fullDexManagerContract.address) //Contract not whitelisted
    ).to.be.revertedWith(
      "1000",
      "Should not be able to assign to a contract not whitelisted"
    );

    await expect(
      holdingFactoryContract.connect(owner).assignHolding(anotherHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    const holdingNewUser = await holdingFactoryContract.holdingUser(
      holdingContract.address
    );
    console.log(
      `   ➡️ Is holding assigned to the new user: ${
        holdingNewUser.toLowerCase() == anotherHolder.address.toLowerCase()
          ? "yes"
          : "no"
      }`
    );
    expect(
      holdingNewUser.toLowerCase(),
      "✖️ Holding should be assigned to the new user"
    ).to.eq(anotherHolder.address.toLowerCase());
  });

  it("should deposit", async () => {
    const usdcAmount = 10000000000;

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);

    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);

    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .deposit(USDT_ADDRESS, usdcAmount)
    ).to.revertedWith("3001");

    await expect(
      holdingFactoryContract.connect(tokensHolder).deposit(USDC_ADDRESS, 0)
    ).to.revertedWith("2001");

    const depositTx = await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);
    const depositRc = await depositTx.wait();

    const gasCostInEth = (depositRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );
    const holdingBalanceOfUsdc = await usdc.balanceOf(holdingContract.address);
    console.log(
      `   ➡️ Holding contract USDC : ${holdingBalanceOfUsdc / 10 ** 6}`
    );
    expect(
      parseFloat(holdingBalanceOfUsdc / 10 ** 6),
      `Holding balance should be ${usdcAmount / 10 ** 6} USDC`
    ).to.eq(parseFloat(usdcAmount / 10 ** 6));
  });

  it("should withdraw token", async () => {
    const usdcAmount = 10000000000;
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await expect(
      holdingFactoryContract.connect(tokensHolder).withdraw(USDT_ADDRESS, 0)
    ).to.revertedWith("2001");

    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .withdraw(USDT_ADDRESS, usdcAmount)
    ).to.revertedWith("2001");

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);

    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    const depositTx = await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    let holdingBalanceOfUsdc = await usdc.balanceOf(holdingContract.address);
    console.log(`   ➡️ Holding contract USDC : ${holdingBalanceOfUsdc}`);
    const withdrawTx = await holdingFactoryContract
      .connect(tokensHolder)
      .withdraw(USDC_ADDRESS, usdcAmount);
    const withdrawRc = await withdrawTx.wait();

    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ Withdraw cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );
    holdingBalanceOfUsdc = await usdc.balanceOf(holdingContract.address);
    console.log(`   ➡️ Holding contract USDC : ${holdingBalanceOfUsdc}`);
    expect(
      parseFloat(holdingBalanceOfUsdc),
      "✖️ Holding balance should be 0"
    ).to.eq(0);
  });

  it("should exchange all tokens with one of the whitelisted ones", async () => {
    const usdcAmount = 10000000000;

    const abiCoder = new ethers.utils.AbiCoder();
    const deadline = abiCoder.encode(
      ["uint256"],
      [ethers.utils.parseEther("100")]
    );

    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await expect(
      fullManager.connect(owner).whitelistToken(USDT_ADDRESS)
    ).to.emit(fullManager, "TokenWhitelisted");

    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .exchange(1, USDC_ADDRESS, USDT_ADDRESS, 0, 0, deadline)
    ).to.revertedWith("2001");

    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .exchange(1, USDC_ADDRESS, USDT_ADDRESS, usdcAmount, 0, deadline)
    ).to.revertedWith("2100");

    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .exchange(
          1,
          USDT_ADDRESS,
          USDC_ADDRESS,
          usdcAmount,
          ethers.utils.parseEther("0.000001"),
          deadline
        )
    ).to.revertedWith("2002");

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);

    // Add funds to the holding
    await usdt
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    const depositTx = await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, usdcAmount);
    await depositTx.wait();

    let holdingBalanceOfUsdt = await usdt.balanceOf(holdingContract.address);
    console.log(
      `   ➡️ Holding contract USDT : ${holdingBalanceOfUsdt / 10 ** 6}`
    );

    // Register AMM
    const balanceBeforeSwap = await usdt.balanceOf(holdingContract.address);
    console.log(`   balance of holding usdt: ${balanceBeforeSwap}`);
    const swapTx = await holdingFactoryContract
      .connect(tokensHolder)
      .exchange(
        1,
        USDT_ADDRESS,
        USDC_ADDRESS,
        usdcAmount,
        ethers.utils.parseEther("0.000000001"),
        deadline
      );
    const swapRc = await swapTx.wait();

    const gasCostInEth = (swapRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(`   ➡️ Swap cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`);

    holdingBalanceOfUsdt = await usdt.balanceOf(holdingContract.address);
    holdingBalanceOfUsdc = await usdc.balanceOf(holdingContract.address);

    holdingManagerBalanceOfUsdc = await usdc.balanceOf(holdingContract.address);
    const swapTxReceipt = await swapTx.wait();

    const swapPerformedEv = parseEvent(
      swapTxReceipt,
      fullDexManagerContract,
      "SwapPerformed"
    );

    expect(swapPerformedEv.args.amountOutObtained).to.be.eq(
      holdingManagerBalanceOfUsdc,
      "New balance does not match swap result"
    );

    console.log(
      `   ➡️ Holding contract USDT : ${holdingBalanceOfUsdt / 10 ** 6}`
    );
    console.log(
      `   ➡️ Holding contract USDC : ${holdingBalanceOfUsdc / 10 ** 6}`
    );
  });

  it("should deposit and borrow the stablecoin", async () => {
    const usdcAmount = 10000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    const holdingUser = await holdingFactoryContract.holdingUser(
      holdingContract.address
    );

    const depositTx = await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);
    const depositRc = await depositTx.wait();

    const gasCostInEth = (depositRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    //check collateral
    const liquidationInfo = await fullStableManagerContract.getLiquidationInfo(
      holdingContract.address,
      USDC_ADDRESS
    );

    console.log(`   ➡️ Existing collateral: ${liquidationInfo[1]}`);
    expect(
      parseFloat(liquidationInfo[1]),
      "✖️ Collateral amount not right"
    ).to.eq(usdcAmount);

    const toBorrow = 4000000000; //max is 50%
    const borrowTx = await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);
    const borrowRc = await borrowTx.wait();
    const gasCostInEthBorrow = (borrowRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsdBorrow = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ Borrow cost : ${gasCostInEthBorrow} ETH or ${gasCostInUsdBorrow} USD`
    );

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(`   User borrowed amount: ${totalBorrowed}`);
    expect(parseFloat(totalBorrowed), "✖️ Borrowed amount not right").to.eq(
      toBorrow
    );

    const balanceOfStable = await fullPandoraMoneyContract.balanceOf(
      holdingUser
    );
    console.log(`   User stable balance: ${balanceOfStable}`);
    expect(
      parseFloat(balanceOfStable),
      "✖️ Stable user's balance not right"
    ).to.eq(parseFloat(totalBorrowed) * 10 ** 12);
  });

  it("should perform multiple deposits and borrow from all of them in one transaction", async () => {
    const usdcAmount = 10000000000;
    const toBorrowUsdc = 4000000000;
    const usdtAmount = 10000000000;
    const toBorrowUsdt = 4000000000;
    const daiAmount = ethers.utils.parseEther("10000");
    const toBorrowDai = ethers.utils.parseEther("4000");
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);

    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);

    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdtAmount);
    await usdt
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdtAmount);

    await dai.connect(binanceWallet).transfer(tokensHolder.address, daiAmount);
    await dai
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, daiAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await fullManager.connect(owner).whitelistToken(DAI_ADDRESS);
    await fullManager.connect(owner).whitelistToken(USDT_ADDRESS);

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, usdtAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(DAI_ADDRESS, daiAmount);

    const borrowData = [
      {
        token: USDC_ADDRESS,
        amount: toBorrowUsdc,
      },
      {
        token: USDT_ADDRESS,
        amount: toBorrowUsdt,
      },
      {
        token: DAI_ADDRESS,
        amount: toBorrowDai,
      },
    ];

    const borrowTx = await holdingFactoryContract
      .connect(tokensHolder)
      .borrowMultiple(borrowData, true);
    const borrowRc = await borrowTx.wait();
    const gasCostInEthBorrow = (borrowRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsdBorrow = gasCostInEthBorrow * ethVirtualPrice;
    console.log(
      `   ➡️ Repay cost : ${gasCostInEthBorrow} ETH or ${gasCostInUsdBorrow} USD`
    );

    const stableBalance = await fullPandoraMoneyContract.balanceOf(
      tokensHolder.address
    );

    console.log(`   ➡️ Final stablecoin balance: ${stableBalance}`);
    expect(
      parseFloat(ethers.utils.formatEther(stableBalance)),
      "✖️ Stable balance not right"
    ).to.eq(12000);
  });

  it("should borrow and repay", async () => {
    const usdcAmount = 10000000000;
    const toBorrowUsdc = 4000000000;
    const toRepayUsdc = 2000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrowUsdc, true);

    const collateral = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Collateral amount: ${collateral}`);

    const repayTx = await holdingFactoryContract
      .connect(tokensHolder)
      .repay(USDC_ADDRESS, toRepayUsdc, true);
    const repayRc = await repayTx.wait();
    const gasCostInEthRepay = (repayRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsdRepay = gasCostInEthRepay * ethVirtualPrice;
    console.log(
      `   ➡️ Repay cost : ${gasCostInEthRepay} ETH or ${gasCostInUsdRepay} USD`
    );

    const borrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );

    expect(parseFloat(borrowed), "✖️ Final borrowed amount not right").to.eq(
      parseFloat(toBorrowUsdc) - parseFloat(toRepayUsdc)
    );

    const stableBalance = await fullPandoraMoneyContract.balanceOf(
      tokensHolder.address
    );
    console.log(`   Final stable amount: ${stableBalance}`);
  });

  it("should perform multiple deposits, borrow from all and repay only part of them", async () => {
    const usdcAmount = 10000000000;
    const toBorrowUsdc = 4000000000;
    const usdtAmount = 10000000000;
    const toBorrowUsdt = 4000000000;
    const daiAmount = ethers.utils.parseEther("10000");
    const toBorrowDai = ethers.utils.parseEther("4000");
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);
    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);

    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);

    await usdt
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdtAmount);
    await usdt
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdtAmount);

    await dai.connect(binanceWallet).transfer(tokensHolder.address, daiAmount);
    await dai
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, daiAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await fullManager.connect(owner).whitelistToken(DAI_ADDRESS);
    await fullManager.connect(owner).whitelistToken(USDT_ADDRESS);

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDT_ADDRESS, usdtAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(DAI_ADDRESS, daiAmount);

    const borrowData = [
      {
        token: USDC_ADDRESS,
        amount: toBorrowUsdc,
      },
      {
        token: USDT_ADDRESS,
        amount: toBorrowUsdt,
      },
      {
        token: DAI_ADDRESS,
        amount: toBorrowDai,
      },
    ];

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrowMultiple(borrowData, true);

    const repayData = [
      {
        token: USDC_ADDRESS,
        amount: toBorrowUsdc,
      },
      {
        token: USDT_ADDRESS,
        amount: toBorrowUsdt,
      },
    ];

    const repayTx = await holdingFactoryContract
      .connect(tokensHolder)
      .repayMultiple(repayData, true);
    const repayRc = await repayTx.wait();
    const gasCostInEthBorrow = (repayRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsdBorrow = gasCostInEthBorrow * ethVirtualPrice;
    console.log(
      `   ➡️ Borrow cost : ${gasCostInEthBorrow} ETH or ${gasCostInUsdBorrow} USD`
    );

    const stableBalance = await fullPandoraMoneyContract.balanceOf(
      tokensHolder.address
    );

    console.log(`   ➡️ Final stablecoin balance: ${stableBalance}`);
    expect(
      parseFloat(ethers.utils.formatEther(stableBalance)),
      "✖️ Stable balance not right"
    ).to.eq(parseFloat(ethers.utils.formatEther(toBorrowDai)));
  });

  it("should deposit, invest and borrow", async () => {
    const usdcAmount = 10000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    const holdingUser = await holdingFactoryContract.holdingUser(
      holdingContract.address
    );

    const depositTx = await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);
    const depositRc = await depositTx.wait();

    const gasCostInEth = (depositRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsd = gasCostInEth * ethVirtualPrice;
    console.log(
      `   ➡️ Deposit cost : ${gasCostInEth} ETH or ${gasCostInUsd} USD`
    );

    //check collateral
    const liquidationInfo = await fullStableManagerContract.getLiquidationInfo(
      holdingContract.address,
      USDC_ADDRESS
    );

    console.log(`   ➡️ Existing collateral: ${liquidationInfo[1]}`);
    expect(
      parseFloat(liquidationInfo[1]),
      "✖️ Collateral amount not right"
    ).to.eq(usdcAmount);

    const investTx = await fullStrategyManager
      .connect(tokensHolder)
      .invest(USDC_ADDRESS, fullAaveStrategy.address, usdcAmount, EMPTY_BYTES);
    const investRc = await investTx.wait();
    const gasCostInEthInvest = (investRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsdInvest = gasCostInEthInvest * ethVirtualPrice;

    console.log(
      `   ➡️ Invest cost : ${gasCostInEthInvest} ETH or ${gasCostInUsdInvest} USD`
    );

    const toBorrow = 4000000000; //max is 50%
    const borrowTx = await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);
    const borrowRc = await borrowTx.wait();
    const gasCostInEthBorrow = (borrowRc.gasUsed * gweiVirtual) / 10 ** 9;
    const gasCostInUsdBorrow = gasCostInEthBorrow * ethVirtualPrice;
    console.log(
      `   ➡️ Borrow cost : ${gasCostInEthBorrow} ETH or ${gasCostInUsdBorrow} USD`
    );

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(`   User borrowed amount: ${totalBorrowed}`);
    expect(parseFloat(totalBorrowed), "✖️ Borrowed amount not right").to.eq(
      toBorrow
    );

    const balanceOfStable = await fullPandoraMoneyContract.balanceOf(
      holdingUser
    );
    console.log(`   User stable balance: ${balanceOfStable}`);
    expect(
      parseFloat(balanceOfStable),
      "✖️ Stable user's balance not right"
    ).to.eq(parseFloat(totalBorrowed) * 10 ** 12);
  });

  it("should test partial withdrawals in case of borrowing", async () => {
    const usdcAmount = 10000000000;
    const halfUsdcAmount = 5000000000;
    const toWtihdraw = 4000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await (
      await holdingFactoryContract
        .connect(tokensHolder)
        .deposit(USDC_ADDRESS, usdcAmount)
    ).wait();

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDC_ADDRESS,
          fullAaveStrategy.address,
          halfUsdcAmount,
          EMPTY_BYTES
        )
    ).wait();

    const toBorrow = 2500000000; //max is 50%
    await (
      await holdingFactoryContract
        .connect(tokensHolder)
        .borrow(USDC_ADDRESS, toBorrow, true)
    ).wait();

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(`   Total borrowed: ${totalBorrowed}`);

    expect(totalBorrowed, "✖️ Total borrow is not right").to.be.eq(toBorrow);

    //claimInvestment

    const usdcBalanceOfHoldingBeforeClaim = await usdc.balanceOf(
      holdingContract.address
    );
    console.log(
      `   Holding USDC balance before claim: ${usdcBalanceOfHoldingBeforeClaim}`
    );
    expect(
      parseFloat(usdcBalanceOfHoldingBeforeClaim),
      "✖️ Holding balance should be half"
    ).to.be.eq(parseFloat(halfUsdcAmount));

    const tokenOutContract = await ethers.getContractAt("IERC20", tokenOut);
    let aaveShares = await tokenOutContract.balanceOf(holdingContract.address);
    await fullStrategyManager
      .connect(tokensHolder)
      .claimInvestment(
        holdingContract.address,
        fullAaveStrategy.address,
        aaveShares,
        USDC_ADDRESS,
        EMPTY_BYTES
      );

    const usdcBalanceOfHoldingAfterClaim = await usdc.balanceOf(
      holdingContract.address
    );
    console.log(
      `   Holding USDC balance after claim: ${usdcBalanceOfHoldingAfterClaim}`
    );
    expect(
      parseFloat(usdcBalanceOfHoldingAfterClaim),
      "✖️ Holding balance should be close to initial"
    ).to.be.greaterThan(parseFloat(halfUsdcAmount));

    //withdraw 4000000000
    await holdingFactoryContract
      .connect(tokensHolder)
      .withdraw(USDC_ADDRESS, toWtihdraw);

    const usdcBalanceOfHoldingAfterWithdraw = await usdc.balanceOf(
      holdingContract.address
    );
    console.log(
      `   Holding USDC balance after withdraw: ${usdcBalanceOfHoldingAfterWithdraw}`
    );
    expect(
      parseFloat(usdcBalanceOfHoldingAfterWithdraw),
      "✖️ Holding balance after withdraw not right"
    ).to.be.eq(
      parseFloat(usdcBalanceOfHoldingAfterClaim) - parseFloat(toWtihdraw)
    );

    const overLimitBorrow = 600000000; //600
    const inLimitsBorrow = 490000000;
    await expect(
      holdingFactoryContract
        .connect(tokensHolder)
        .borrow(USDC_ADDRESS, overLimitBorrow, true)
    ).to.revertedWith("3009");

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, inLimitsBorrow, true);

    const totalFinalBorrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(`   Total final borrowed: ${totalFinalBorrowed}`);
    expect(
      parseFloat(totalFinalBorrowed),
      "✖️ Final borrowed amount not right"
    ).to.be.eq(parseFloat(toBorrow) + parseFloat(inLimitsBorrow));
  });

  it("should self liquidate", async () => {
    const usdcAmount = 10000000000;
    const halfUsdcAmount = 5000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await (
      await holdingFactoryContract
        .connect(tokensHolder)
        .deposit(USDC_ADDRESS, usdcAmount)
    ).wait();

    await (
      await fullStrategyManager
        .connect(tokensHolder)
        .invest(
          USDC_ADDRESS,
          fullAaveStrategy.address,
          halfUsdcAmount,
          EMPTY_BYTES
        )
    ).wait();

    const toBorrow = 4000000000; //max is 50%
    await (
      await holdingFactoryContract
        .connect(tokensHolder)
        .borrow(USDC_ADDRESS, toBorrow, true)
    ).wait();

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(`   Total borrowed: ${totalBorrowed}`);

    const initialCollateral = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Total collateral: ${initialCollateral}`);

    const balanceOfStablecoin = await fullPandoraMoneyContract.balanceOf(
      tokensHolder.address
    );
    console.log(`   Total stablecoin balance: ${balanceOfStablecoin}`);

    const balanceOfFeeAddressUSDC = await usdc.balanceOf(owner.address);
    console.log(
      `   Total fee address USDC balance: ${balanceOfFeeAddressUSDC}`
    );

    const liquidationData = {
      _strategies: [fullAaveStrategy.address],
      _strategiesData: [EMPTY_BYTES],
    };

    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .selfLiquidate(USDC_ADDRESS, totalBorrowed, liquidationData);

    const collateralAfterSelfLiquidation =
      await fullShareRegistryContract.collateral(holdingContract.address);
    console.log(
      `   Total updated collateral: ${collateralAfterSelfLiquidation}`
    );

    const totalBorrowedAFterSelfLiquidation =
      await fullShareRegistryContract.borrowed(holdingContract.address);
    console.log(
      `   Total updated borrowed: ${totalBorrowedAFterSelfLiquidation}`
    );

    const balanceOfFeeAddressUSDCAfter = await usdc.balanceOf(owner.address);
    console.log(
      `   Total updated fee address USDC balance: ${balanceOfFeeAddressUSDCAfter}`
    );

    const balanceOfStablecoinAfter = await fullPandoraMoneyContract.balanceOf(
      tokensHolder.address
    );
    console.log(
      `   Total updated stablecoin balance: ${balanceOfStablecoinAfter}`
    );

    expect(balanceOfFeeAddressUSDCAfter, "✖️ Fee balance not right").to.be.eq(
      toBorrow
    );

    expect(
      totalBorrowedAFterSelfLiquidation,
      "✖️ Total borrow should be 0"
    ).to.be.eq(0);

    expect(
      collateralAfterSelfLiquidation,
      "✖️ Total collateral should be lower"
    ).to.be.eq(6000000000);
  });

  it("should partially exchange USDC with DAI", async () => {
    const usdcAmount = 10000000000;
    const toExchangeAmount = 2000000000;
    const toBorrow = 4000000000;

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");
    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);

    const collateralFromBefore = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral from before: ${parseFloat(collateralFromBefore) / 10 ** 6}`
    );

    const borrowedFromBefore = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from before: ${parseFloat(borrowedFromBefore) / 10 ** 6}`
    );

    const collateralToBefore = await daiShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral to before: ${parseFloat(collateralToBefore) / 10 ** 18}`
    );

    const borrowedToBefore = await daiShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed to before: ${parseFloat(borrowedToBefore) / 10 ** 18}`
    );

    await fullManager.connect(owner).whitelistToken(DAI_ADDRESS);
    const abiCoder = new ethers.utils.AbiCoder();
    const deadline = abiCoder.encode(
      ["uint256"],
      [ethers.utils.parseEther("100")]
    );
    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .exchange(
        1,
        USDC_ADDRESS,
        DAI_ADDRESS,
        toExchangeAmount,
        1000000,
        deadline
      );
    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);

    const daiBalanceOfHolding = await dai.balanceOf(holdingContract.address);
    console.log(`   DAI balance: ${daiBalanceOfHolding}`);
    expect(
      parseFloat(daiBalanceOfHolding),
      "✖️ USDT balance not right"
    ).to.be.greaterThan(0);

    const collateralFromAfter = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral from after: ${parseFloat(collateralFromAfter) / 10 ** 6}`
    );

    const borrowedFromAfter = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from after: ${parseFloat(borrowedFromAfter) / 10 ** 6}`
    );

    const collateralToAfter = await daiShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral to after: ${parseFloat(collateralToAfter) / 10 ** 18}`
    );

    const borrowedToAfter = await daiShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed to after: ${parseFloat(borrowedToAfter) / 10 ** 18}`
    );
  });

  it("should partially exchange USDC with UDST", async () => {
    const usdcAmount = 10000000000;
    const toExchangeAmount = 2000000000;
    const toBorrow = 4000000000;

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");
    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);

    const collateralFromBefore = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral from before: ${parseFloat(collateralFromBefore) / 10 ** 6}`
    );

    const borrowedFromBefore = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from before: ${parseFloat(borrowedFromBefore) / 10 ** 6}`
    );

    const collateralToBefore = await usdtShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral to before: ${parseFloat(collateralToBefore) / 10 ** 6}`
    );

    const borrowedToBefore = await usdtShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed to before: ${parseFloat(borrowedToBefore) / 10 ** 6}`
    );

    await fullManager.connect(owner).whitelistToken(USDT_ADDRESS);
    const abiCoder = new ethers.utils.AbiCoder();
    const deadline = abiCoder.encode(
      ["uint256"],
      [ethers.utils.parseEther("100")]
    );
    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .exchange(
        1,
        USDC_ADDRESS,
        USDT_ADDRESS,
        toExchangeAmount,
        1000000,
        deadline
      );
    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);

    const usdtBalanceOfHolding = await usdt.balanceOf(holdingContract.address);
    console.log(`   USDT balance: ${usdtBalanceOfHolding}`);
    expect(
      parseFloat(usdtBalanceOfHolding),
      "✖️ USDT balance not right"
    ).to.be.greaterThan(0);

    const collateralFromAfter = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral from after: ${parseFloat(collateralFromAfter) / 10 ** 6}`
    );

    expect(
      parseFloat(collateralFromAfter),
      "✖️ Collateral from after not right"
    ).to.be.greaterThan(0);

    const borrowedFromAfter = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from after: ${parseFloat(borrowedFromAfter) / 10 ** 6}`
    );
    expect(
      parseFloat(borrowedFromAfter),
      "✖️ Borrowed from after not right"
    ).to.be.greaterThan(0);

    const collateralToAfter = await usdtShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(
      `   Collateral to after: ${parseFloat(collateralToAfter) / 10 ** 6}`
    );
    expect(
      parseFloat(collateralToAfter),
      "✖️ Collateral from after not right"
    ).to.be.greaterThan(0);

    const borrowedToAfter = await usdtShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed to after: ${parseFloat(borrowedToAfter) / 10 ** 6}`
    );
    expect(
      parseFloat(borrowedToAfter),
      "✖️ Borrowed from after not right"
    ).to.be.greaterThan(0);
  });

  it("should exchange USDC with USDT", async () => {
    const usdcAmount = 10000000000;
    const toBorrow = 4000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");
    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);

    const usdcBalanceOfHolding = await usdc.balanceOf(holdingContract.address);
    console.log(`   USDC balance: ${usdcBalanceOfHolding}`);
    expect(usdcBalanceOfHolding, "✖️ USDC balance not right").to.be.eq(
      usdcAmount
    );

    const borrowedFromBefore = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from before: ${parseFloat(borrowedFromBefore) / 10 ** 6}`
    );

    await fullManager.connect(owner).whitelistToken(USDT_ADDRESS);
    const abiCoder = new ethers.utils.AbiCoder();
    const deadline = abiCoder.encode(
      ["uint256"],
      [ethers.utils.parseEther("100")]
    );
    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .exchange(1, USDC_ADDRESS, USDT_ADDRESS, usdcAmount, 1000000, deadline);
    const usdt = await ethers.getContractAt("IERC20", USDT_ADDRESS);

    const usdtBalanceOfHolding = await usdt.balanceOf(holdingContract.address);
    console.log(`   USDT balance: ${usdtBalanceOfHolding}`);
    expect(
      parseFloat(usdtBalanceOfHolding),
      "✖️ USDT balance not right"
    ).to.be.greaterThan(0);

    //check collateral
    const currentUsdtCollateral = await usdtShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Current USDT collateral: ${currentUsdtCollateral}`);
    expect(
      parseFloat(currentUsdtCollateral),
      "✖️ USDC collateral not right"
    ).to.be.eq(parseFloat(usdtBalanceOfHolding));

    const finalUsdcCollateral = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Current USDC collateral: ${finalUsdcCollateral}`);
    expect(
      parseFloat(finalUsdcCollateral),
      "✖️ Final USDC collateral not right"
    ).to.be.eq(0);

    const borrowedFromAfter = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from after: ${parseFloat(borrowedFromAfter) / 10 ** 6}`
    );
    expect(
      parseFloat(borrowedFromAfter),
      "✖️ Borrowed from should be 0"
    ).to.be.eq(0);

    const borrowedToAfter = await usdtShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed to after: ${parseFloat(borrowedToAfter) / 10 ** 6}`
    );
    expect(
      parseFloat(borrowedToAfter),
      "✖️ Borrowed to should be equal to borrowed from before exchange"
    ).to.be.eq(parseFloat(borrowedFromBefore));
  });

  it("should exchange USDC with DAI", async () => {
    const usdcAmount = 10000000000;
    const toBorrow = 4000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");
    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);

    const usdcBalanceOfHolding = await usdc.balanceOf(holdingContract.address);
    console.log(`   USDC balance: ${usdcBalanceOfHolding}`);
    expect(usdcBalanceOfHolding, "✖️ USDC balance not right").to.be.eq(
      usdcAmount
    );

    const borrowedFromBefore = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from before: ${parseFloat(borrowedFromBefore) / 10 ** 6}`
    );

    await fullManager.connect(owner).whitelistToken(DAI_ADDRESS);
    const abiCoder = new ethers.utils.AbiCoder();
    const deadline = abiCoder.encode(
      ["uint256"],
      [ethers.utils.parseEther("100")]
    );
    await fullHoldingFactoryContract
      .connect(tokensHolder)
      .exchange(1, USDC_ADDRESS, DAI_ADDRESS, usdcAmount, 1000000, deadline);
    const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);

    const daiBalanceOfHolding = await dai.balanceOf(holdingContract.address);
    console.log(`   DAI balance: ${daiBalanceOfHolding}`);
    expect(
      parseFloat(daiBalanceOfHolding),
      "✖️ DAI balance not right"
    ).to.be.greaterThan(0);

    //check collateral
    const currentDaiCollateral = await daiShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Current DAI collateral: ${currentDaiCollateral}`);

    const finalUsdcCollateral = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Current USDC collateral: ${finalUsdcCollateral}`);
    expect(
      parseFloat(finalUsdcCollateral),
      "✖️ Final USDC collateral not right"
    ).to.be.eq(0);

    const borrowedFromAfter = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed from after: ${parseFloat(borrowedFromAfter) / 10 ** 6}`
    );
    expect(
      parseFloat(borrowedFromAfter),
      "✖️ Borrowed from should be 0"
    ).to.be.eq(0);

    const borrowedToAfter = await daiShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(
      `   Borrowed to after: ${parseFloat(borrowedToAfter) / 10 ** 18}`
    );
  });

  it("should force register and force remove collateral", async () => {
    const usdcAmount = 10000000000;
    const toBorrow = 4000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await (
      await holdingFactoryContract
        .connect(tokensHolder)
        .deposit(USDC_ADDRESS, usdcAmount)
    ).wait();

    const currentCollateral = await fullShareRegistryContract.collateral(
      holdingContract.address
    );
    console.log(`   Current collateral: ${currentCollateral}`);

    expect(
      parseFloat(currentCollateral),
      "✖️ Initial collateral not right"
    ).to.be.eq(usdcAmount);

    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);

    // force add
    await fullStableManagerContract.forceAddCollateral(
      holdingContract.address,
      USDC_ADDRESS,
      usdcAmount
    );
    const currentCollateralAfterForceAdd =
      await fullShareRegistryContract.collateral(holdingContract.address);
    console.log(
      `   Collateral after force add: ${currentCollateralAfterForceAdd}`
    );

    expect(
      parseFloat(currentCollateralAfterForceAdd),
      "✖️ Collateral after force add not right"
    ).to.be.eq(2 * usdcAmount);

    await fullStableManagerContract.forceRemoveCollateral(
      holdingContract.address,
      USDC_ADDRESS,
      2 * usdcAmount
    );

    const currentCollateralAfterForceRemove =
      await fullShareRegistryContract.collateral(holdingContract.address);
    console.log(
      `   Collateral after force remove: ${currentCollateralAfterForceRemove}`
    );

    expect(
      parseFloat(currentCollateralAfterForceRemove),
      "✖️ Collateral after force remove not right"
    ).to.be.eq(0);

    const solvency = await fullStableManagerContract.isSolvent(
      USDC_ADDRESS,
      holdingContract.address
    ); //should NOT be solvent

    expect(solvency, "✖️ User should not be solvent").to.be.false;
  });

  // Skipping this one because of the Aave bug
  it.skip("should liquidate", async () => {
    const usdcAmount = 10000000000;
    const halfUsdcAmount = 5000000000;
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    await usdc
      .connect(binanceWallet)
      .transfer(tokensHolder.address, usdcAmount);
    await usdc
      .connect(tokensHolder)
      .approve(holdingFactoryContract.address, usdcAmount);
    await expect(
      holdingFactoryContract.connect(owner).assignHolding(tokensHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await expect(
      holdingFactoryContract.connect(owner).assignHolding(anotherHolder.address)
    ).to.emit(holdingFactoryContract, "HoldingAssigned");

    await holdingFactoryContract
      .connect(tokensHolder)
      .deposit(USDC_ADDRESS, usdcAmount);

    await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDC_ADDRESS,
        fullAaveStrategy.address,
        halfUsdcAmount,
        EMPTY_BYTES
      );

    await fullStrategyManager
      .connect(tokensHolder)
      .invest(
        USDC_ADDRESS,
        yearnUsdcStrategy.address,
        halfUsdcAmount,
        EMPTY_BYTES
      );

    const toBorrow = 4000000000; //max is 50%
    await holdingFactoryContract
      .connect(tokensHolder)
      .borrow(USDC_ADDRESS, toBorrow, true);

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      holdingContract.address
    );
    console.log(`   Total borrowed: ${totalBorrowed}`);

    await fullOracleContract.setPriceForLiquidation();
    await fullShareRegistryContract.updateExchangeRate();

    await fullPandoraMoneyContract
      .connect(owner)
      .mint(anotherHolder.address, toBorrow, 6);

    const stableBalance = await fullPandoraMoneyContract.balanceOf(
      anotherHolder.address
    );
    console.log(`   Stable balance: ${stableBalance}`);

    const tokenOut = await fullAaveStrategy.tokenOut();
    const tokenOutContract = await ethers.getContractAt("IERC20", tokenOut);
    let investedInAave = await tokenOutContract.balanceOf(
      holdingContract.address
    );
    const investedInYearn = await yearnUsdcStrategy.recipients(
      holdingContract.address
    );

    console.log(`   Invested in aave: ${investedInAave}`);
    console.log(`   Invested in yearn: ${investedInYearn[0]}`);

    const liquidationData = {
      _strategies: [fullAaveStrategy.address, yearnUsdcStrategy.address],
      _strategiesData: [EMPTY_BYTES, EMPTY_BYTES],
      _maxLoss: 100, //0.01%
      _burnFromUser: true,
    };

    const shouldBeLiquidatable = await fullHoldingFactoryContract
      .connect(anotherHolder)
      .callStatic.liquidate(
        holdingContract.address,
        USDC_ADDRESS,
        liquidationData
      );

    console.log(
      `   Liquidation status after exchange rate update: ${
        shouldBeLiquidatable[0] ? " liquidatable" : " not liquidatable"
      }`
    );
    console.log(`   needed: ${shouldBeLiquidatable[1]}`);
    console.log(`   fee: ${shouldBeLiquidatable[2]}`);

    const balanceOfLiquidatedHoldingBefore = await usdc.balanceOf(
      holdingContract.address
    );
    console.log(`   liquidated: ${balanceOfLiquidatedHoldingBefore}`);

    await fullHoldingFactoryContract
      .connect(anotherHolder)
      .liquidate(holdingContract.address, USDC_ADDRESS, liquidationData);

    const balanceOfLiquidatedHolding = await usdc.balanceOf(
      holdingContract.address
    );
    const balanceOfLiquidatingHolding = await usdc.balanceOf(
      anotherHoldingContract.address
    );
    const balanceOfLiquidatingFee = await usdc.balanceOf(owner.address);
    console.log(`   Liquidated balance : ${balanceOfLiquidatedHolding}`);
    console.log(`   Liquidating balance: ${balanceOfLiquidatingHolding}`);
    console.log(`   Fee address balance: ${balanceOfLiquidatingFee}`);

    const loss = (usdcAmount * 100) / 1e5;
    expect(
      balanceOfLiquidatedHolding / 10 ** 6,
      "✖️ Liquidated balance should be under max loss"
    ).to.be.lessThan(loss);

    const feeCalculatedBalance = 0.1 * (usdcAmount / 10 ** 6);
    expect(
      balanceOfLiquidatingFee / 10 ** 6,
      "✖️ Fee balance not right"
    ).to.be.greaterThan(feeCalculatedBalance);

    const collateralOfLiquidatedUser =
      await fullShareRegistryContract.collateral(holdingContract.address);

    const collateralOfLiquidatingUser =
      await fullShareRegistryContract.collateral(
        anotherHoldingContract.address
      );

    console.log(
      `   Collateral of just liquidated user : ${collateralOfLiquidatedUser}`
    );
    console.log(
      `   Collateral of just liquidating user: ${collateralOfLiquidatingUser}`
    );
    expect(
      collateralOfLiquidatedUser,
      "✖️ Liquidated should have no collateral anymore"
    ).to.eq(0);
    expect(balanceOfLiquidatingHolding, "✖️ Final collateral not right").to.eq(
      collateralOfLiquidatingUser
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
  ] = await deploy_basic_contracts(owner, USDC_ADDRESS, data, EMPTY_BYTES);

  //deploy yearn
  const yearnVault = await ethers.getContractAt(
    "IYearnVault",
    "0xa354f35829ae975e850e23e9615b11da1b3dc4de"
  );

  const yearnUsdcFactory = await ethers.getContractFactory("YearnStablecoin");
  yearnUsdcStrategy = await yearnUsdcFactory
    .connect(owner)
    .deploy(yearnVault.address, fullManagerContainer.address);

  const aaveFactory = await ethers.getContractFactory("AaveStablecoin");
  fullAaveStrategy = await aaveFactory
    .connect(owner)
    .deploy(
      fullManagerContainer.address,
      lendingPool,
      incentivesController,
      tokenIn,
      tokenOut
    );

  await fullStrategyManager
    .connect(owner)
    .addStrategy(fullAaveStrategy.address);

  await fullStrategyManager
    .connect(owner)
    .addStrategy(yearnUsdcStrategy.address);

  await fullManager.connect(owner).whitelistToken(USDC_ADDRESS);

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

  //deploy share registry
  daiShareRegistryContract = await registryFactory.connect(owner).deploy(
    owner.address,
    fullManagerContainer.address,
    DAI_ADDRESS,
    fullOracleContract.address,
    EMPTY_BYTES, //oracle data
    data // contract data
  );

  const setDaiRegistryTx =
    await fullStableManagerContract.registerShareRegistry(
      daiShareRegistryContract.address,
      DAI_ADDRESS
    );
  await setDaiRegistryTx.wait();
}
