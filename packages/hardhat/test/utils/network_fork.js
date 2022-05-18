const { network } = require("hardhat");

const FORK_BLOCK = 14564071; // Fork defaults to this block

async function fork_network(block) {
  forkingParams = {
    jsonRpcUrl: process.env.ALCHEMY_API,
  };
  if (!block) {
    // Default option
    forkingParams.blockNumber = FORK_BLOCK;
  } else if (block != "latest") {
    // Specific block
    forkingParams.blockNumber = block;
  }
  // if block == "latest" takes last block

  /// Use mainnet fork as provider
  return network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: forkingParams,
      },
    ],
  });
}

async function fork_reset() {
  return network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
}

async function mine_blocks(numberOfBlocks) {
  for (let i = 0; i < numberOfBlocks; i++) {
    await network.provider.send("evm_mine");
  }
}

async function increase_block_timestamp(time) {
  return network.provider.send("evm_increaseTime", [time]);
}

async function time_travel(time) {
  increase_block_timestamp(time);
  mine_blocks(1);
}

module.exports = {
  fork_network,
  time_travel,
  fork_reset,
  mine_blocks,
  increase_block_timestamp,
  time_travel,
};
