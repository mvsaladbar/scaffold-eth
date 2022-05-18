const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { EMPTY_ADDRESS, EMPTY_BYTES } = require("./utils/constants");
const { parseEvent } = require("./utils/parse_events");

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
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should deploy a new manager and update the managerContainer acccordingly", async () => {
    console.log("Old manager: ", fullManager.address);
    const managerFactory = await ethers.getContractFactory("Manager");
    const newManagerContract = await managerFactory
      .connect(owner)
      .deploy(USDC_ADDRESS);
    console.log("New manager: ", newManagerContract.address);

    const updateManagerTx = await fullManagerContainer
      .connect(owner)
      .updateManager(newManagerContract.address);
    const updateManagerRc = await updateManagerTx.wait();

    const managerUpdatedEv = parseEvent(
      updateManagerRc,
      fullManagerContainer,
      "ManagerUpdated"
    );

    expect(managerUpdatedEv.args.oldAddress).to.be.eq(
      fullManager.address,
      "Wrong old address"
    );
    expect(managerUpdatedEv.args.newAddress).to.be.eq(
      newManagerContract.address,
      "Wrong new address"
    );
  });

  it("should check that the new manager is being accessed by other contracts", async () => {
    console.log('First creating one holding');
    await fullHoldingFactoryContract.connect(owner).createHolding();

    console.log('Now creating new manager');
    const managerFactory = await ethers.getContractFactory("Manager");
    const newManagerContract = await managerFactory
      .connect(owner)
      .deploy(USDC_ADDRESS);

    console.log('Setting new maxAvailableHoldings to 1');
    await newManagerContract.connect(owner).setMaxAvailableHoldings(1);

    console.log('Updating managerContainer to have new manager');
    const updateManagerTx = await fullManagerContainer
      .connect(owner)
      .updateManager(newManagerContract.address);
    await updateManagerTx.wait();


    console.log('Trying to create new holding');
    // If new manager is being used, this should fail

    await expect(
      fullHoldingFactoryContract.connect(owner).createHolding()
    ).to.be.revertedWith("2000", "Should not be allowed because of new limit");
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
