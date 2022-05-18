const { ethers } = require("hardhat");

async function deploy_basic_contracts(
  owner,
  shareRegistryToken,
  shareRegistryData,
  oracleData
) {
  //deploy Manager
  const managerFactory = await ethers.getContractFactory("Manager");
  const USDC = process.env.USDC_ADDRESS;
  const fullManager = await managerFactory.connect(owner).deploy(USDC);

  //deploy ManagerContainer
  const managerContainerFactory = await ethers.getContractFactory(
    "ManagerContainer"
  );
  const fullManagerContainer = await managerContainerFactory
    .connect(owner)
    .deploy(fullManager.address);

  //deploy StrategyManager
  const strategyfactory = await ethers.getContractFactory("StrategyManager");
  const fullStrategyManager = await strategyfactory
    .connect(owner)
    .deploy(fullManagerContainer.address);

  const setStrategyManager = await fullManager
    .connect(owner)
    .setStrategyManager(fullStrategyManager.address);
  await setStrategyManager.wait();

  //deploy HoldingManager
  const holdingFactory = await ethers.getContractFactory("HoldingManager");
  const fullHoldingFactoryContract = await holdingFactory
    .connect(owner)
    .deploy(fullManagerContainer.address);

  const setHoldingManagerTx = await fullManager
    .connect(owner)
    .setHoldingManager(fullHoldingFactoryContract.address);
  await setHoldingManagerTx.wait();

  //init DexManager
  const dexManagerAddress = "0x44cc93f5110933ea2702c8b88f393f91c39fc669";
  const fullDexManagerContract = await ethers.getContractAt(
    "IDexManager",
    dexManagerAddress
  );

  const setDexManagerTx = await fullManager
    .connect(owner)
    .setDexManager(fullDexManagerContract.address);
  await setDexManagerTx.wait();

  //deploy sample oracle
  const oracleFactory = await ethers.getContractFactory("SampleOracle");
  const fullOracleContract = await oracleFactory.connect(owner).deploy();

  //deploy stablecoin
  const pandoraMoneyFactory = await ethers.getContractFactory("PandoraUSD");
  const fullPandoraMoneyContract = await pandoraMoneyFactory
    .connect(owner)
    .deploy(fullManagerContainer.address);

  //deploy stables manager
  const stableManagerFactory = await ethers.getContractFactory(
    "StablesManager"
  );
  const fullStableManagerContract = await stableManagerFactory
    .connect(owner)
    .deploy(fullManagerContainer.address, fullPandoraMoneyContract.address);

  const setStableManagerTx = await fullManager.setStablecoinManager(
    fullStableManagerContract.address
  );
  await setStableManagerTx.wait();

  const feeAddressTx = await fullManager.setFeeAddress(owner.address);
  await feeAddressTx.wait();

  //deploy share registry
  const registryFactory = await ethers.getContractFactory("SharesRegistry");
  const fullShareRegistryContract = await registryFactory.connect(owner).deploy(
    owner.address,
    fullManagerContainer.address,
    shareRegistryToken,
    fullOracleContract.address,
    oracleData, //oracle data
    shareRegistryData // contract data
  );

  const setRegistryTx = await fullStableManagerContract.registerShareRegistry(
    fullShareRegistryContract.address,
    shareRegistryToken
  );
  await setRegistryTx.wait();

  //deploy protocol token
  const erc20Factory = await ethers.getContractFactory("SampleTokenERC20");
  const fullProtocolTokenContract = await erc20Factory
    .connect(owner)
    .deploy("AlcBox", "ABX", (10 ** 20).toString());

  const setProtocolTokenTx = await fullManager
    .connect(owner)
    .setProtocolToken(fullProtocolTokenContract.address);
  await setProtocolTokenTx.wait();

  const transferTokenTx = await fullProtocolTokenContract
    .connect(owner)
    .transfer(fullHoldingFactoryContract.address, (10 ** 20).toString());
  await transferTokenTx.wait();

  return [
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
  ];
}

module.exports = {
  deploy_basic_contracts,
};
