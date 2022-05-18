const { ethers } = require("hardhat");

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES = ethers.utils.toUtf8Bytes("");

module.exports = {
  EMPTY_ADDRESS,
  EMPTY_BYTES,
};
