const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { EMPTY_BYTES } = require("../utils/constants");
const { fork_network } = require("../utils/network_fork");

let owner, modChainlinkOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("TWAP UniswapV2 Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();

    await mockContracts();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("check SUSHI price", async () => {
    await expect(
      twapUniswapV2OracleContract.connect(owner).get(EMPTY_BYTES)
    ).to.emit(twapUniswapV2OracleContract, "PriceUpdated");

    const [success, price] = await twapUniswapV2OracleContract.peek(
      EMPTY_BYTES
    );
    console.log(`Sushi price: ${price}`);
    expect(success).to.be.true;
    expect(parseInt(price)).to.greaterThan(1, "Incorrect price");
  });
});

async function mockContracts() {
  const modChainlinkOracleCF = await ethers.getContractFactory(
    "ModChainlinkOracle"
  );
  modChainlinkOracleContract = await modChainlinkOracleCF
    .connect(owner)
    .deploy();
  twapUniswapV2OracleCF = await ethers.getContractFactory(
    "TwapUniswapV2Oracle"
  );
  twapUniswapV2OracleContract = await twapUniswapV2OracleCF
    .connect(owner)
    .deploy(
      process.env.UNISWAP_V2_FACTORY, // factory
      process.env.SUSHI_ADDRESS, // principal
      process.env.UNI_ADDRESS, // base
      modChainlinkOracleContract.address, // price oracle
      10 * 60 // 10 minutes
    );
}
