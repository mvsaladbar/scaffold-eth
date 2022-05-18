const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const impersonateAccount = require("./utils/impersonate_account");
const { EMPTY_ADDRESS, EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;

let owner, tokensHolder;
let shareRegistryContract,
  fullShareRegistryContract,
  fullOracleContract,
  fullManagerContract;

chai.use(solidity);
let expect = chai.expect;

describe("ShareRegistry - Tests mainnet fork", async () => {
  beforeEach(async () => {
    await fork_network();
    [owner, tokensHolder, user3] = await ethers.getSigners();

    await mockContracts();
    shareRegistryContract = await ethers.getContractAt(
      "ISharesRegistry",
      fullShareRegistryContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should have the right constructor arguments", async () => {
    const collateralizationRate =
      await shareRegistryContract.collateralizationRate();
    console.log(
      `   collateralizationRate: ${ethers.utils.formatEther(
        collateralizationRate
      )}`
    );

    const borrowOpeningFee = await shareRegistryContract.borrowOpeningFee();
    console.log(
      `   borrowOpeningFee: ${ethers.utils.formatEther(borrowOpeningFee)}`
    );

    const liquidationMultiplier =
      await shareRegistryContract.liquidationMultiplier();
    console.log(
      `   liquidationMultiplier: ${ethers.utils.formatEther(
        liquidationMultiplier
      )}`
    );

    expect(
      parseFloat(ethers.utils.formatEther(collateralizationRate)),
      "✖️ collateralizationRate not right"
    ).to.eq(1);

    expect(
      parseFloat(ethers.utils.formatEther(borrowOpeningFee)),
      "✖️ borrowOpeningFee not right"
    ).to.eq(1);

    expect(
      parseFloat(ethers.utils.formatEther(liquidationMultiplier)),
      "✖️ liquidationMultiplier not right"
    ).to.eq(1);

    const managerContainerAddress =
      await shareRegistryContract.managerContainer();
    expect(
      managerContainerAddress.toLowerCase(),
      "✖️ ManagerContainer not right"
    ).to.eq(fullManagerContainerContract.address.toLowerCase());

    const tokenAddress = await shareRegistryContract.token();
    expect(tokenAddress.toLowerCase(), "✖️ Token not right").to.eq(
      USDC_ADDRESS.toLowerCase()
    );

    const oracleAddress = await shareRegistryContract.oracle();
    expect(oracleAddress.toLowerCase(), "✖️ Oracle not right").to.eq(
      fullOracleContract.address.toLowerCase()
    );
  });

  it("should transfer ownership", async () => {
    const ownerBefore = await shareRegistryContract.owner();
    const temporaryOwnerBefore = await shareRegistryContract.temporaryOwner();
    expect(ownerBefore.toLowerCase(), "✖️ Current owner not right").to.eq(
      owner.address.toLowerCase()
    );
    expect(
      temporaryOwnerBefore.toLowerCase(),
      "✖️ Temporary owner not right"
    ).to.eq(EMPTY_ADDRESS.toLowerCase());

    await shareRegistryContract
      .connect(owner)
      .transferOwnership(tokensHolder.address);

    const temporaryOwnerNow = await shareRegistryContract.temporaryOwner();
    expect(
      temporaryOwnerNow.toLowerCase(),
      "✖️ Temporary owner after change not right"
    ).to.eq(tokensHolder.address.toLowerCase());

    await expect(
      shareRegistryContract.connect(owner).acceptOwnership()
    ).to.revertedWith("1000");

    await shareRegistryContract.connect(tokensHolder).acceptOwnership();

    const ownerNow = await shareRegistryContract.owner();
    expect(ownerNow.toLowerCase(), "✖️ Owner after change not right").to.eq(
      temporaryOwnerNow.toLowerCase()
    );

    await expect(
      shareRegistryContract.connect(tokensHolder).acceptOwnership()
    ).to.revertedWith("3020");
  });

  it("should register collateral", async () => {
    const collateralToAdd = 10000000;

    await expect(
      shareRegistryContract
        .connect(tokensHolder)
        .registerCollateral(tokensHolder.address, collateralToAdd)
    ).to.revertedWith("1000");

    await fullManagerContract.setStablecoinManager(tokensHolder.address);

    const collateralBefore = await shareRegistryContract.collateral(
      tokensHolder.address
    );

    expect(collateralBefore, "✖️ Collateral before not right").to.eq(0);

    await shareRegistryContract
      .connect(tokensHolder)
      .registerCollateral(tokensHolder.address, collateralToAdd);

    const collateralAfter = parseFloat(
      await shareRegistryContract.collateral(tokensHolder.address)
    );
    expect(collateralAfter, "✖️ Collateral after not right").to.eq(
      collateralToAdd
    );
  });

  it("should unregister collateral", async () => {
    const collateralToAdd = 10000000;
    await fullManagerContract.setStablecoinManager(tokensHolder.address);

    await shareRegistryContract
      .connect(tokensHolder)
      .registerCollateral(tokensHolder.address, collateralToAdd);

    const collateralBefore = parseFloat(
      await shareRegistryContract.collateral(tokensHolder.address)
    );
    expect(collateralBefore, "✖️ Collateral before not right").to.eq(
      collateralToAdd
    );

    //TODO: complete test after stableManager code is finished
  });

  it("should accrue fees", async () => {
    const currentAccrueInfo = await shareRegistryContract.accrueInfo();
    console.log(`   Current fees: ${currentAccrueInfo[1]}`);

    expect(currentAccrueInfo[1], "✖️ Before accrueing not right").to.eq(0);

    await expect(
      shareRegistryContract
        .connect(tokensHolder)
        .accrueFees(ethers.utils.parseEther("1"))
    ).to.revertedWith("1000");

    await fullManagerContract.setStablecoinManager(tokensHolder.address);

    await shareRegistryContract
      .connect(tokensHolder)
      .accrueFees(ethers.utils.parseEther("1"));

    const lastAccuredInfo = await shareRegistryContract.accrueInfo();
    console.log(
      `   Current fees: ${ethers.utils.formatEther(lastAccuredInfo[1])}`
    );
    expect(
      parseFloat(lastAccuredInfo[1]),
      "✖️ After accrueing not right"
    ).to.eq(parseFloat(ethers.utils.parseEther("1")));
  });

  it("update liquidity collateral", async () => {
    const collateralToAdd = 10000000;
    await fullManagerContract.setStablecoinManager(tokensHolder.address);
    await shareRegistryContract
      .connect(tokensHolder)
      .registerCollateral(tokensHolder.address, collateralToAdd);

    const user3CollateralBefore = await shareRegistryContract.collateral(
      user3.address
    );

    expect(
      parseFloat(user3CollateralBefore),
      "✖️ User 3 collateral not right before"
    ).to.eq(0);

    await expect(
      shareRegistryContract
        .connect(owner)
        .updateLiquidatedCollateral(
          tokensHolder.address,
          user3.address,
          collateralToAdd
        )
    ).to.revertedWith("1000");

    await shareRegistryContract
      .connect(tokensHolder)
      .updateLiquidatedCollateral(
        tokensHolder.address,
        user3.address,
        collateralToAdd
      );

    const user3CollateralAfter = await shareRegistryContract.collateral(
      user3.address
    );

    const liquidatedUserCollateral = await shareRegistryContract.collateral(
      tokensHolder.address
    );

    expect(
      parseFloat(liquidatedUserCollateral),
      "✖️ Liquidated user collateral not right after"
    ).to.eq(0);
    expect(
      parseFloat(user3CollateralAfter),
      "✖️ User 3 collateral not right after"
    ).to.eq(collateralToAdd);
  });

  it("should update the exchange rate", async () => {
    const beforeUpdateExchangeRate = await shareRegistryContract.exchangeRate();
    console.log(`   Exchange rate: ${beforeUpdateExchangeRate}`);

    expect(
      parseFloat(beforeUpdateExchangeRate),
      "✖️ Exchange rate before update not right"
    ).to.eq(0);

    await shareRegistryContract.updateExchangeRate();

    const afterUpdateExchangeRate = await shareRegistryContract.exchangeRate();
    console.log(`   Exchange rate: ${afterUpdateExchangeRate}`);
    expect(
      parseFloat(afterUpdateExchangeRate),
      "✖️ Exchange rate after update not right"
    ).to.eq(1e18);
  });
});

async function mockContracts() {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["uint", "uint", "uint"],
    [
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("1"),
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
