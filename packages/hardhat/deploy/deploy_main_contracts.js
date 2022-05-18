const { chainIdToName } = require("../scripts/utils");
const { deployNonUpgradable } = require("./utils");

module.exports = async ({ getChainId }) => {
  const chainId = await getChainId();

  const { deployer } = await getNamedAccounts();
  const owner = await ethers.getSigner(deployer);

  //deploy Manager
  console.log("# Deploying Manager");
  const manager = await deployNonUpgradable("Manager", [process.env.USDC_ADDRESS]);

  //deploy StrategyManager
  console.log("# Deploying StrategyManager");
  const strategyManager = await deployNonUpgradable("StrategyManager", [
    manager.address,
  ]);

  if ((await manager.strategyManager()) != strategyManager.address) {
    console.log("=> calling setStrategyManager");
    const setStrategyManager = await manager
      .connect(owner)
      .setStrategyManager(strategyManager.address);
    await setStrategyManager.wait();
  } else {
    console.log("=> strategy manager address already set in manager");
  }

  //deploy HoldingManager
  console.log("# Deploying HoldingManager");
  const holdingManager = await deployNonUpgradable("HoldingManager", [
    manager.address,
  ]);

  if ((await manager.holdingManager()) != holdingManager.address) {
    console.log("=> calling setHoldingManager");
    const setHoldingManagerTx = await manager
      .connect(owner)
      .setHoldingManager(holdingManager.address);
    await setHoldingManagerTx.wait();
  } else {
    console.log("=> holding manager address already set in manager");
  }

  //deploy DexManager
  console.log("# Deploying DexManager");
  const dexManager = await deployNonUpgradable("DexManager", [false]);

  if ((await manager.dexManager()) != dexManager.address) {
    console.log("=> calling setDexManager");
    const setDexManagerTx = await manager
      .connect(owner)
      .setDexManager(dexManager.address);
    await setDexManagerTx.wait();
  } else {
    console.log("=> dex manager address already set in manager");
  }

  //deploy SampleTokenERC20
  console.log("# Deploying SampleTokenERC20");
  const protocolToken = await deployNonUpgradable("SampleTokenERC20", [
    "AlcBox",
    "ABX",
    (10 ** 20).toString(),
  ]);

  if ((await manager.protocolToken()) != protocolToken.address) {
    console.log("=> calling setProtocolToken");
    const setProtocolTokenTx = await manager
      .connect(owner)
      .setProtocolToken(protocolToken.address);
    await setProtocolTokenTx.wait();
    console.log("=> calling transfer");
    const transferTokenTx = await protocolToken
      .connect(owner)
      .transfer(holdingManager.address, (10 ** 20).toString());
    await transferTokenTx.wait();
  } else {
    console.log("=> protocolToken address already set in manager");
  }

  //deploy pUSD
  console.log("# Deploying PandoraUSD");
  const pandoramoney = await deployNonUpgradable("PandoraUSD", [manager.address]);

  //deploy StablesManager
  console.log("# Deploying StablesManager");
  const stablesManager = await deployNonUpgradable("StablesManager", [
    manager.address,
    pandoramoney.address,
  ]);

  if ((await manager.stablesManager()) != stablesManager.address) {
    console.log("=> calling setStablecoinManager");
    const setStablecoinManagerTx = await manager
      .connect(owner)
      .setStablecoinManager(stablesManager.address);
    await setStablecoinManagerTx.wait();
  } else {
    console.log("=> stables manager address already set in manager");
  }
};

module.exports.tags = ["MainContracts_deploy"];
