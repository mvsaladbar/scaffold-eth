const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;

let owner, tokensHolder;
let stableManagerContract,
  fullStableManagerContract,
  fullShareRegistryContract,
  fullPandoraMoneyContract,
  fullManagerContract;

const liquidationMultiplier = 107500;
chai.use(solidity);
let expect = chai.expect;

describe("StablesManager - Tests mainnet fork", async () => {
  beforeEach(async () => {
    await fork_network();
    [owner, tokensHolder, user3] = await ethers.getSigners();

    await mockContracts();
    stableManagerContract = await ethers.getContractAt(
      "IStablesManager",
      fullStableManagerContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should have the right constructor arguments", async () => {
    const pandoraMoneyAddress = await stableManagerContract.pandoraUSD();
    const managerContainerAddress =
      await stableManagerContract.managerContainer();

    expect(
      managerContainerAddress.toLowerCase(),
      "✖️ ManagerContainer not right"
    ).to.eq(fullManagerContainerContract.address.toLowerCase());
    expect(pandoraMoneyAddress.toLowerCase(), "✖️ PandoraUSD not right").to.eq(
      fullPandoraMoneyContract.address.toLowerCase()
    );
  });

  it("should transform amount to shares", async () => {
    const convertedAmount = 10000000;
    const shares = await stableManagerContract.toShare(
      USDC_ADDRESS,
      convertedAmount,
      true
    );
    console.log(`   Shares: ${shares}`);

    expect(parseFloat(shares), "✖️ Share amount not right").to.eq(
      convertedAmount
    );
  });

  it("should transform shares to amount", async () => {
    const convertedAmount = 10000000;
    const amount = await stableManagerContract.toAmount(
      USDC_ADDRESS,
      convertedAmount,
      true
    );
    console.log(`   Amount: ${amount}`);

    expect(parseFloat(amount), "✖️ Amount not right").to.eq(convertedAmount);
  });

  it("should check non-existing user solvency status", async () => {
    const unexistingUserSolvency = await stableManagerContract.isSolvent(
      USDC_ADDRESS,
      user3.address
    );

    expect(unexistingUserSolvency, "✖️ Unexisting user should be solvent").to.be
      .true;
  });

  it("should register collateral", async () => {
    const collateralToAdd = 10000000;

    const shares = await stableManagerContract.toShare(
      USDC_ADDRESS,
      collateralToAdd,
      false
    );

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd)
    ).to.revertedWith("1000");

    await fullManagerContract.setHoldingManager(tokensHolder.address);
    await stableManagerContract
      .connect(tokensHolder)
      .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd);

    const totals = await stableManagerContract.totals(USDC_ADDRESS);
    console.log(`   Total elastic: ${totals[0]}`);
    console.log(`   Total base: ${totals[1]}`);

    expect(parseFloat(totals[0]), "✖️ Totals elastic not right").to.eq(shares);
    expect(parseFloat(totals[1]), "✖️ Totals base not right").to.eq(
      collateralToAdd
    );

    const totalCollateral = await fullShareRegistryContract.collateral(
      user3.address
    );
    console.log(`   Total collateral: ${totalCollateral}`);
    expect(parseFloat(totalCollateral), "✖️ Totals collateral not right").to.eq(
      shares
    );

    // add collateral one more time
    await stableManagerContract
      .connect(tokensHolder)
      .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd);
    const sharesTwo = await stableManagerContract.toShare(
      USDC_ADDRESS,
      collateralToAdd,
      false
    );
    console.log(`   Shares for 2nd deposit: ${sharesTwo}`);

    expect(parseFloat(sharesTwo), "✖️ Shares - 2nd time, not right").to.eq(
      shares
    );

    const finalTotalCollateral = await fullShareRegistryContract.collateral(
      user3.address
    );
    console.log(`   Final collateral: ${finalTotalCollateral}`);
  });

  it("should remove collateral", async () => {
    const collateralToAdd = 10000000;

    await fullManagerContract.setHoldingManager(tokensHolder.address);

    await stableManagerContract
      .connect(tokensHolder)
      .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd);

    const totalCollateral = await fullShareRegistryContract.collateral(
      user3.address
    );
    expect(parseFloat(totalCollateral), "✖️ Totals collateral not right").to.eq(
      collateralToAdd
    );

    const collateralToRemove = 5000000;

    await stableManagerContract
      .connect(tokensHolder)
      .removeCollateral(user3.address, USDC_ADDRESS, collateralToRemove);

    const finalTotalCollateral = await fullShareRegistryContract.collateral(
      user3.address
    );
    console.log(`   Final collateral: ${finalTotalCollateral}`);
    expect(
      parseFloat(finalTotalCollateral),
      "✖️ Totals collateral not right"
    ).to.eq(collateralToRemove);

    const solvency = await stableManagerContract.isSolvent(
      USDC_ADDRESS,
      user3.address
    ); //should be solvent as nothing was borrowed

    expect(solvency, "✖️ User should be solvent").to.be.true;
  });

  it("should borrow", async () => {
    const collateralToAdd = 10000000;
    const toBorrow = 4000000; //40%
    const borrowOverLimit = 6000000;

    await fullManagerContract.setHoldingManager(tokensHolder.address);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, 0, false)
    ).to.revertedWith("3010");

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, toBorrow, false)
    ).to.revertedWith("3009");

    await stableManagerContract
      .connect(tokensHolder)
      .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, borrowOverLimit, false)
    ).to.revertedWith("3009");

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, toBorrow, false)
    ).to.emit(stableManagerContract, "Borrowed");

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      user3.address
    );
    console.log(`   User borrowed amount: ${totalBorrowed}`);

    const openingFee = parseFloat(
      await fullShareRegistryContract.borrowOpeningFee()
    );

    const fullBorrowedAmount = toBorrow + (toBorrow * openingFee) / 100000;
    console.log(`   Calculated borrowed amount: ${fullBorrowedAmount}`);

    expect(parseFloat(totalBorrowed), "✖️ Total borrowed not right").to.eq(
      fullBorrowedAmount
    );

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, toBorrow, false)
    ).to.revertedWith("3009");
  });

  it("should repay the entire borrowed amount", async () => {
    const collateralToAdd = 10000000;
    const toBorrow = 4000000; //40%

    await fullManagerContract.setHoldingManager(tokensHolder.address);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .repay(user3.address, USDC_ADDRESS, toBorrow, false, false)
    ).to.revertedWith("3011");

    await stableManagerContract
      .connect(tokensHolder)
      .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, toBorrow, false)
    ).to.emit(stableManagerContract, "Borrowed");

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .repay(user3.address, USDC_ADDRESS, 0, false, false)
    ).to.revertedWith("3012");

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      user3.address
    );

    const borrowedShares = await fullShareRegistryContract.borrowedShares(
      user3.address
    );

    const borrowed = await fullShareRegistryContract.borrowed(user3.address);
    console.log(`   Total borrowed: ${totalBorrowed / 10 ** 6}`);
    console.log(`   Borrowed: ${borrowed / 10 ** 6}`);
    console.log(`   Borrowed shares: ${borrowedShares / 10 ** 6}`);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .repay(user3.address, USDC_ADDRESS, totalBorrowed, false, false)
    ).to.emit(stableManagerContract, "Repayed");

    const borrowedAfterRepay = await fullShareRegistryContract.borrowed(
      user3.address
    );

    expect(
      parseFloat(borrowedAfterRepay),
      "✖️ Borrowed amount should be 0 now"
    ).to.eq(0);

    const totalCollateral = await fullShareRegistryContract.collateral(
      user3.address
    );
    expect(
      parseFloat(totalCollateral),
      "✖️ Collateral should remain intact"
    ).to.eq(collateralToAdd);

    const totalBorrowedAfterRepay = await stableManagerContract.totalBorrowed(
      USDC_ADDRESS
    );
    const borrowedSharesAfterRepay =
      await fullShareRegistryContract.borrowedShares(user3.address);

    expect(
      parseFloat(totalBorrowedAfterRepay),
      "✖️ Total borrowed after repay should be 0 now"
    ).to.eq(0);

    expect(
      parseFloat(borrowedSharesAfterRepay),
      "✖️ Borrowed shares after repay should be 0 now"
    ).to.eq(0);
  });

  it("should partially repay", async () => {
    const collateralToAdd = 10000000;
    const toBorrow = 4000000;

    await fullManagerContract.setHoldingManager(tokensHolder.address);

    await stableManagerContract
      .connect(tokensHolder)
      .addCollateral(user3.address, USDC_ADDRESS, collateralToAdd);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .borrow(user3.address, USDC_ADDRESS, toBorrow, false)
    ).to.emit(stableManagerContract, "Borrowed");

    const totalBorrowed = await fullShareRegistryContract.borrowed(
      user3.address
    );

    const halfRepayAmount = parseFloat(totalBorrowed) / 2;
    console.log(`   Partial amount to be repayed: ${halfRepayAmount}`);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .repay(user3.address, USDC_ADDRESS, halfRepayAmount, false, false)
    ).to.emit(stableManagerContract, "Repayed");

    const totalBorrowedAfterRepay = await stableManagerContract.totalBorrowed(
      USDC_ADDRESS
    );
    const borrowedSharesAfterRepay =
      await fullShareRegistryContract.borrowedShares(user3.address);

    expect(
      parseFloat(totalBorrowedAfterRepay),
      "✖️ Total borrowed after repay should be half now"
    ).to.eq(halfRepayAmount);

    expect(
      parseFloat(borrowedSharesAfterRepay),
      "✖️ Borrowed shares after repay should be half now"
    ).to.eq(halfRepayAmount);

    await expect(
      stableManagerContract
        .connect(tokensHolder)
        .repay(user3.address, USDC_ADDRESS, halfRepayAmount, false, false)
    ).to.emit(stableManagerContract, "Repayed");

    const totalBorrowedAfter2ndRepay =
      await stableManagerContract.totalBorrowed(USDC_ADDRESS);
    const borrowedSharesAfter2ndRepay =
      await fullShareRegistryContract.borrowedShares(user3.address);

    expect(
      parseFloat(totalBorrowedAfter2ndRepay),
      "✖️ Total borrowed after full repay should be 0 now"
    ).to.eq(0);

    expect(
      parseFloat(borrowedSharesAfter2ndRepay),
      "✖️ Borrowed shares after full repay should be 0 now"
    ).to.eq(0);
  });
});

async function mockContracts() {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["uint", "uint", "uint"],
    [
      "50000", //collateralization ratio 50%
      liquidationMultiplier.toString(), //liquidation multiplier
      "0", //"500", //borrow opening fee
    ]
  );

  [
    fullManagerContract,
    fullManagerContainerContract,
    fullStrategyManager,
    fullHoldingFactoryContract,
    fullDexManagerContract,
    fullProtocolTokenContract,
    fullOracleContract,
    fullPandoraMoneyContract,
    fullStableManagerContract,
    fullShareRegistryContract,
  ] = await deploy_basic_contracts(owner, USDC_ADDRESS, data, EMPTY_BYTES);
}
