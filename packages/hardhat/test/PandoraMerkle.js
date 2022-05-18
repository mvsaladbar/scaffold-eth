const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network, fork_reset } = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");

const ethereumjs = require("ethereumjs-util");

let owner, tokensHolder, anotherHolder, andAnotherHolder;
let merkleContract, fullMerkleContract, fullPandoraToken;
let tree, accounts;
let proofs = [];

chai.use(solidity);
let expect = chai.expect;
let gweiVirtual = 100;

const overrides = {
  gasLimit: 9999999,
};

/* Notes section
  Claim cost : 82610 gas (0.008261)
*/

describe("PandoraMerkle - Tests mainnet fork", async () => {
  beforeEach(async () => {
    await fork_network();
    [owner, tokensHolder, anotherHolder, andAnotherHolder, invalidHolder] =
      await ethers.getSigners();
    accounts = [owner, tokensHolder, anotherHolder, andAnotherHolder];

    await mockContracts();
    merkleContract = await ethers.getContractAt(
      "IMerkleDistributor",
      fullMerkleContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should test initial values", async () => {
    const tokenAddr = await merkleContract.token();
    const savedRoot = await merkleContract.merkleRoot();

    expect(tokenAddr.toLowerCase(), "✖️ Token not right").to.eq(
      fullPandoraToken.address.toLowerCase()
    );

    const root = tree.getHexRoot();
    expect(savedRoot.toString(), "✖️ Root not right").to.eq(root.toString());
  });

  it("should not work for invalid user", async () => {
    await expect(
      merkleContract.connect(invalidHolder).claim(0, 10, [])
    ).to.be.revertedWith("3051");
  });

  it("should not work for invalid index", async () => {
    await expect(
      merkleContract.connect(tokensHolder).claim(2, 10, proofs[1])
    ).to.be.revertedWith("3051");
  });

  it("should not work for invalid proof", async () => {
    await expect(
      merkleContract.connect(owner).claim(0, 10, proofs[1])
    ).to.be.revertedWith("3051");
  });

  it("should not claim more than allowed", async () => {
    await expect(
      merkleContract.connect(tokensHolder).claim(0, 500, proofs[0])
    ).to.be.revertedWith("3051");
  });

  it("should test gas", async () => {
    await fullPandoraToken
      .connect(owner)
      .transfer(merkleContract.address, ethers.utils.parseEther("1000"));

    const claimTx = await merkleContract
      .connect(owner)
      .claim(0, 100, proofs[0], overrides);

    const receipt = await claimTx.wait();
    console.log(`   Gas used: ${receipt.gasUsed}`);

    const claimRewardsGasCostInEth = (receipt.gasUsed * gweiVirtual) / 10 ** 9;
    console.log(`   Claim cost: ${claimRewardsGasCostInEth} ETH`);
    expect(claimRewardsGasCostInEth).to.greaterThan(0, "Invalid gas cost");
  });

  it("should claim", async () => {
    const ownerPandoraTokenBalanceBefore = await fullPandoraToken.balanceOf(
      owner.address
    );
    expect(
      parseFloat(ownerPandoraTokenBalanceBefore),
      "✖️ Balance before not right"
    ).to.eq(parseFloat(ethers.utils.parseEther("1000")));

    await fullPandoraToken
      .connect(owner)
      .transfer(merkleContract.address, ethers.utils.parseEther("1000"));

    console.log(
      `   Pandora token balance of owner: ${ownerPandoraTokenBalanceBefore}`
    );

    await expect(
      merkleContract.connect(owner).claim(0, 100, proofs[0], overrides)
    )
      .to.emit(merkleContract, "Claimed")
      .withArgs(0, owner.address, 100);

    const ownerPandoraTokenBalanceAfter = await fullPandoraToken.balanceOf(
      owner.address
    );
    console.log(
      `   Pandora token balance of owner: ${ownerPandoraTokenBalanceAfter}`
    );

    expect(
      parseFloat(ownerPandoraTokenBalanceAfter),
      "✖️ Balance after not right"
    ).to.eq(100);

    const isClaimed = await merkleContract.isClaimed(0);
    console.log(`   Index should be claimed: ${isClaimed}`);
    expect(isClaimed, "✖️ The right index should be claimed").to.be.true;

    const notClaimed = await merkleContract.isClaimed(1);
    console.log(`   Not claimed index shouldn't be claimed: ${notClaimed}`);
    expect(notClaimed, "✖️ The wrong index shouldn't be claimed").to.be.false;

    await expect(
      merkleContract.claim(0, 100, proofs[0], overrides)
    ).to.be.revertedWith("3050");
  });
});

async function mockContracts() {
  const tokenFactory = await ethers.getContractFactory("PandoraToken");
  fullPandoraToken = await tokenFactory
    .connect(owner)
    .deploy("T", "T", ethers.utils.parseEther("1000"));

  let elements = [];
  let count = 4;

  for (let i = 0; i < count; i++) {
    const node = { account: accounts[i].address, amount: 100 };
    elements.push(node);
  }

  tree = new BalanceTree(elements);
  merkleRoot = tree.getHexRoot();

  for (let i = 0; i < count; i++) {
    proof = tree.getProof(i, accounts[i].address, 100);
    proofs.push(proof);
  }

  const merkleFactory = await ethers.getContractFactory("PandoraMerkle");
  fullMerkleContract = await merkleFactory
    .connect(owner)
    .deploy(fullPandoraToken.address, merkleRoot);
}

var BalanceTree = /** @class */ (function () {
  function BalanceTree(balances) {
    this.tree = new MerkleTree(
      balances.map(function (_a, index) {
        var account = _a.account,
          amount = _a.amount;
        return BalanceTree.toNode(index, account, amount);
      })
    );
  }
  BalanceTree.verifyProof = function (index, account, amount, proof, root) {
    var pair = BalanceTree.toNode(index, account, amount);
    for (var _i = 0, proof_1 = proof; _i < proof_1.length; _i++) {
      var item = proof_1[_i];
      pair = MerkleTree.combinedHash(pair, item);
    }
    return pair.equals(root);
  };
  // keccak256(abi.encode(index, account, amount))
  BalanceTree.toNode = function (index, account, amount) {
    return Buffer.from(
      ethers.utils
        .solidityKeccak256(
          ["uint256", "address", "uint256"],
          [index, account, amount]
        )
        .substr(2),
      "hex"
    );
  };
  BalanceTree.prototype.getHexRoot = function () {
    return this.tree.getHexRoot();
  };
  // returns the hex bytes32 values of the proof
  BalanceTree.prototype.getProof = function (index, account, amount) {
    return this.tree.getHexProof(BalanceTree.toNode(index, account, amount));
  };
  return BalanceTree;
})();

var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };

var MerkleTree = /** @class */ (function () {
  function MerkleTree(elements) {
    this.elements = __spreadArrays(elements);
    // Sort elements
    this.elements.sort(Buffer.compare);
    // Deduplicate elements
    this.elements = MerkleTree.bufDedup(this.elements);
    this.bufferElementPositionIndex = this.elements.reduce(function (
      memo,
      el,
      index
    ) {
      memo[ethereumjs.bufferToHex(el)] = index;
      return memo;
    },
    {});
    // Create layers
    this.layers = this.getLayers(this.elements);
  }
  MerkleTree.prototype.getLayers = function (elements) {
    if (elements.length === 0) {
      throw new Error("empty tree");
    }
    var layers = [];
    layers.push(elements);
    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]));
    }
    return layers;
  };
  MerkleTree.prototype.getNextLayer = function (elements) {
    return elements.reduce(function (layer, el, idx, arr) {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(MerkleTree.combinedHash(el, arr[idx + 1]));
      }
      return layer;
    }, []);
  };
  MerkleTree.combinedHash = function (first, second) {
    if (!first) {
      return second;
    }
    if (!second) {
      return first;
    }
    return ethereumjs.keccak256(MerkleTree.sortAndConcat(first, second));
  };
  MerkleTree.prototype.getRoot = function () {
    return this.layers[this.layers.length - 1][0];
  };
  MerkleTree.prototype.getHexRoot = function () {
    return ethereumjs.bufferToHex(this.getRoot());
  };
  MerkleTree.prototype.getProof = function (el) {
    var idx = this.bufferElementPositionIndex[ethereumjs.bufferToHex(el)];
    if (typeof idx !== "number") {
      throw new Error("Element does not exist in Merkle tree");
    }
    return this.layers.reduce(function (proof, layer) {
      var pairElement = MerkleTree.getPairElement(idx, layer);
      if (pairElement) {
        proof.push(pairElement);
      }
      idx = Math.floor(idx / 2);
      return proof;
    }, []);
  };
  MerkleTree.prototype.getHexProof = function (el) {
    var proof = this.getProof(el);
    return MerkleTree.bufArrToHexArr(proof);
  };
  MerkleTree.getPairElement = function (idx, layer) {
    var pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (pairIdx < layer.length) {
      return layer[pairIdx];
    } else {
      return null;
    }
  };
  MerkleTree.bufDedup = function (elements) {
    return elements.filter(function (el, idx) {
      return idx === 0 || !elements[idx - 1].equals(el);
    });
  };
  MerkleTree.bufArrToHexArr = function (arr) {
    if (
      arr.some(function (el) {
        return !Buffer.isBuffer(el);
      })
    ) {
      throw new Error("Array is not an array of buffers");
    }
    return arr.map(function (el) {
      return "0x" + el.toString("hex");
    });
  };
  MerkleTree.sortAndConcat = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    return Buffer.concat(__spreadArrays(args).sort(Buffer.compare));
  };
  return MerkleTree;
})();
