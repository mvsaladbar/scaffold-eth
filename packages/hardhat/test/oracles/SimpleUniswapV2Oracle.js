const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { fork_network } = require("../utils/network_fork");

let owner, modChainlinkOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("Uniswap Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();
    await mockContracts();
  });

  it("should return a rate from LP SUSHI-UNI to USD", async () => {
    pair = "0x6580E58dEd2b562CF5DFA361956f6854F5Cab507"; //SUSHI-UNI
    oracleData = SimpleUniswapOracleV2Contract.getDataParameter(pair);
    const [success, rate] = await SimpleUniswapOracleV2Contract.peek(
      oracleData
    );
    console.log(`Rate is ${rate}`);
    expect(success).to.be.true;
    expect(rate).to.be.gt(1, "Invalid rate");
  });

  it("should fail if the pair does not exist", async () => {
    pair = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; //Not an actual pair!
    oracleData = SimpleUniswapOracleV2Contract.getDataParameter(pair);
    expect(SimpleUniswapOracleV2Contract.peek(oracleData)).to.be.reverted;
  });
});

async function mockContracts() {
  const modChainlinkOracleCF = await ethers.getContractFactory(
    "ModChainlinkOracle"
  );
  modChainlinkOracleContract = await modChainlinkOracleCF
    .connect(owner)
    .deploy();
  SimpleUniswapOracleV2CF = await ethers.getContractFactory(
    "SimpleUniswapOracleV2"
  );
  SimpleUniswapOracleV2Contract = await SimpleUniswapOracleV2CF.connect(
    owner
  ).deploy(modChainlinkOracleContract.address);
}
