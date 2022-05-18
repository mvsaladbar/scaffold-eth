const { ethers } = require("hardhat");
const chai = require("chai");
const {
  fork_network,
  time_travel,
  fork_reset,
} = require("./utils/network_fork");
const { solidity } = require("ethereum-waffle");
const impersonateAccount = require("./utils/impersonate_account");
const { deploy_basic_contracts } = require("./utils/basic_contracts");
const { EMPTY_BYTES } = require("./utils/constants");

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const BINANCE_WALLET_ADDRESS = process.env.BINANCE_WALLET_ADDRESS;

let owner, tokensHolder;
let stakerContract, fullStakerContract, fullPandoraToken, fullStableToken;

const rewardAmounts = ethers.utils.parseEther("100000");
const halfAmounts = ethers.utils.parseEther("50000");

chai.use(solidity);
let expect = chai.expect;

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

let gweiVirtual = 100;

/* Notes section
  Deposit cost : 0.0129624 ETH
  Withdraw cost : 0.0116696 ETH
  Claim cost : 0.0122149 ETH
  Exit cost: 0.0140102 ETH
*/

describe("Staker - Tests mainnet fork", async () => {
  let binanceWallet;
  beforeEach(async () => {
    await fork_network();
    await impersonateAccount(BINANCE_WALLET_ADDRESS);
    binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
    [owner, tokensHolder] = await ethers.getSigners();

    await mockContracts();
    stakerContract = await ethers.getContractAt(
      "IStaker",
      fullStakerContract.address
    );
  });

  afterEach(async () => {
    await fork_reset();
  });

  it("should do nothing except run beforeEach", async () => {
    await expect(true).to.be.true;
  });

  it("should test initial values", async () => {
    const savedTokenIn = await stakerContract.tokenIn();
    const savedRewardToken = await stakerContract.rewardToken();

    expect(savedTokenIn.toLowerCase(), "✖️ Token in not right").to.eq(
      fullStableToken.address.toLowerCase()
    );

    expect(savedRewardToken.toLowerCase(), "✖️ Reward token not right").to.eq(
      fullPandoraToken.address.toLowerCase()
    );

    const balanceOfStaker = await fullPandoraToken.balanceOf(
      stakerContract.address
    );
    expect(parseFloat(balanceOfStaker), "✖️ Reward balance").to.eq(
      parseFloat(rewardAmounts)
    );

    const stakedAmount = await fullStableToken.balanceOf(
      stakerContract.address
    );
    expect(stakedAmount, "✖️ Should not have any stakes").to.eq(0);
  });

  it("should test owner only", async () => {
    await fullStakerContract.setPaused(true);

    const currentPauseVault = await fullStakerContract.paused();
    expect(currentPauseVault, "✖️ Should be paused").to.be.true;

    await fullStakerContract.setPaused(false);
    const newPauseVault = await fullStakerContract.paused();
    expect(newPauseVault, "✖️ Should NOT be paused").to.be.false;

    // function emergencySave(address _token, uint256 _amount)
    const balanceOfStaker = await fullPandoraToken.balanceOf(
      stakerContract.address
    );

    const initialOwnerBalance = await fullPandoraToken.balanceOf(owner.address);
    await fullStakerContract
      .connect(owner)
      .emergencySave(fullPandoraToken.address, balanceOfStaker);
    const afterOwnerBalance = await fullPandoraToken.balanceOf(owner.address);

    expect(parseFloat(afterOwnerBalance), "✖️ Owner balance not right").to.eq(
      parseFloat(initialOwnerBalance) + parseFloat(balanceOfStaker)
    );
  });

  it("should stake for the entire duration", async () => {
    const balanceOfOwner = await fullStableToken.balanceOf(owner.address);
    expect(
      parseFloat(balanceOfOwner),
      "✖️ Staking token balance of owner is not right"
    ).to.eq(parseFloat(rewardAmounts));

    const initialStakingBalance = await stakerContract.balanceOf(owner.address);
    expect(
      initialStakingBalance,
      "✖️ Staking balance of owner not right"
    ).to.eq(0);

    const initialTotalSupply = await stakerContract.totalSupply();
    expect(initialTotalSupply, "✖️ Initial supply not right").to.eq(0);

    const earnedBeforeStaking = await stakerContract.earned(owner.address);
    expect(earnedBeforeStaking, "✖️ Earned before staking not right").to.eq(0);

    const rewardRate = await stakerContract.rewardRate();
    console.log(`   ➡️ Reward rate : ${rewardRate}`);
    const rewardDuration = await stakerContract.rewardsDuration();
    console.log(`   ➡️ Reward duration : ${rewardDuration}`);

    const computedRewardsAfter100Days =
      parseFloat(ethers.utils.formatEther(rewardRate.toString())) * 100 * DAY;

    const toDeposit = ethers.utils.parseEther("1");
    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, toDeposit);

    await stakerContract.connect(owner).deposit(toDeposit);

    const afterDepositTotalSupply = await stakerContract.totalSupply();
    expect(
      parseFloat(afterDepositTotalSupply),
      "✖️ Total supply not right"
    ).to.eq(parseFloat(toDeposit));

    const afterDepositStakingBalance = await stakerContract.balanceOf(
      owner.address
    );
    expect(
      parseFloat(afterDepositStakingBalance),
      "✖️ Staked by owner not right"
    ).to.eq(parseFloat(toDeposit));

    const earnedAfterDeposit = await stakerContract.earned(owner.address);
    console.log(
      `   ➡️ Earned amount just after deposit : ${earnedAfterDeposit}`
    );
    expect(earnedAfterDeposit, "✖️ Earned just after deposit not right").to.eq(
      0
    );

    //travelling 101 days into the future
    time_travel(101 * DAY);

    const earnedAfter100days = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after 100 days : ${earnedAfter100days}`);
    console.log(
      `   ➡️ Computed rewards 100 days : ${computedRewardsAfter100Days}`
    );
    expect(
      parseFloat(ethers.utils.formatEther(earnedAfter100days)),
      "✖️ Earned after 100 days not right"
    ).to.be.greaterThan(parseFloat(computedRewardsAfter100Days));
  });

  it("should have 2 stakers with the same amounts", async () => {
    await fullStableToken
      .connect(owner)
      .transfer(tokensHolder.address, halfAmounts);

    const ownerBalanceOfStakingToken = await fullStableToken.balanceOf(
      owner.address
    );
    const holderBalanceOfStakingToken = await fullStableToken.balanceOf(
      tokensHolder.address
    );
    expect(
      parseFloat(ownerBalanceOfStakingToken),
      "✖️ Staking token balance of owner"
    ).to.eq(parseFloat(halfAmounts));
    expect(
      parseFloat(holderBalanceOfStakingToken),
      "✖️ Staking token balance of holder"
    ).to.eq(parseFloat(halfAmounts));

    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, halfAmounts);
    await fullStableToken
      .connect(tokensHolder)
      .approve(fullStakerContract.address, halfAmounts);

    await stakerContract.connect(owner).deposit(halfAmounts);
    await stakerContract.connect(tokensHolder).deposit(halfAmounts);

    const rewardRate = await stakerContract.rewardRate();
    console.log(`   ➡️ Reward rate : ${rewardRate}`);
    const rewardDuration = await stakerContract.rewardsDuration();
    console.log(`   ➡️ Reward duration : ${rewardDuration}`);

    const computedRewardsAfter100Days =
      parseFloat(ethers.utils.formatEther(rewardRate.toString())) * 100 * DAY;

    //travelling 101 days into the future
    time_travel(101 * DAY);

    const ownerEarnedAfter100days = await stakerContract.earned(owner.address);
    const holderEarnedAfter100days = await stakerContract.earned(
      tokensHolder.address
    );
    console.log(
      `   ➡️ Owner earned amount after 100 days  : ${ownerEarnedAfter100days}`
    );
    console.log(
      `   ➡️ Holder earned amount after 100 days : ${holderEarnedAfter100days}`
    );

    console.log(
      `   ➡️ Computed rewards 100 days           : ${computedRewardsAfter100Days}`
    );

    expect(
      parseFloat(ownerEarnedAfter100days),
      "✖️ Owner should have just a bit more rewards"
    ).to.be.greaterThan(parseFloat(holderEarnedAfter100days));

    expect(
      parseFloat(ethers.utils.formatEther(ownerEarnedAfter100days)),
      "✖️ Owner should have more than the computed amount"
    ).to.be.greaterThan(parseFloat(computedRewardsAfter100Days) / 2);
  });

  it("should have 2 stakers on different times", async () => {
    await fullStableToken
      .connect(owner)
      .transfer(tokensHolder.address, halfAmounts);

    const ownerBalanceOfStakingToken = await fullStableToken.balanceOf(
      owner.address
    );
    const holderBalanceOfStakingToken = await fullStableToken.balanceOf(
      tokensHolder.address
    );
    expect(
      parseFloat(ownerBalanceOfStakingToken),
      "✖️ Staking token balance of owner"
    ).to.eq(parseFloat(halfAmounts));
    expect(
      parseFloat(holderBalanceOfStakingToken),
      "✖️ Staking token balance of holder"
    ).to.eq(parseFloat(halfAmounts));

    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, halfAmounts);
    await fullStableToken
      .connect(tokensHolder)
      .approve(fullStakerContract.address, halfAmounts);

    await stakerContract.connect(owner).deposit(halfAmounts);
    //travelling 50 days into the future
    time_travel(50 * DAY);
    await stakerContract.connect(tokensHolder).deposit(halfAmounts);

    const rewardRate = await stakerContract.rewardRate();
    console.log(`   ➡️ Reward rate : ${rewardRate}`);
    const rewardDuration = await stakerContract.rewardsDuration();
    console.log(`   ➡️ Reward duration : ${rewardDuration}`);

    //travelling 50 days into the future
    time_travel(51 * DAY);

    const computedRewardsAfter100Days =
      parseFloat(ethers.utils.formatEther(rewardRate.toString())) * 100 * DAY;

    const ownerEarnedAfter100days = await stakerContract.earned(owner.address);
    const holderEarnedAfter100days = await stakerContract.earned(
      tokensHolder.address
    );
    console.log(
      `   ➡️ Owner earned amount after 100 days  : ${ownerEarnedAfter100days}`
    );
    console.log(
      `   ➡️ Holder earned amount after 100 days : ${holderEarnedAfter100days}`
    );

    console.log(
      `   ➡️ Computed rewards 100 days           : ${computedRewardsAfter100Days}`
    );

    const totalRewards =
      parseFloat(ethers.utils.formatEther(ownerEarnedAfter100days)) +
      parseFloat(ethers.utils.formatEther(holderEarnedAfter100days));

    expect(
      parseFloat(totalRewards),
      "✖️ Total rewards should be a bit higher than computed amount"
    ).to.be.greaterThan(parseFloat(computedRewardsAfter100Days));
  });

  it("should claim rewards", async () => {
    const toDeposit = ethers.utils.parseEther("1");
    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, toDeposit);
    await stakerContract.connect(owner).deposit(toDeposit);

    //travelling 101 days into the future
    time_travel(101 * DAY);

    const earnedAfter100days = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after 100 days : ${earnedAfter100days}`);

    const claimRewardTx = await stakerContract.connect(owner).claimRewards();
    const claimRewardsRc = await claimRewardTx.wait();
    const ev = claimRewardsRc.events.find(
      (evInfo) => evInfo.event == "RewardPaid"
    );
    const [evSender, evAmount] = ev.args;
    console.log(`   ➡️ Event earned rewards        : ${evAmount}`);

    const gasCostInEth = (claimRewardsRc.gasUsed * gweiVirtual) / 10 ** 9;

    console.log(`   ➡️ Claim cost : ${gasCostInEth} ETH`);

    const earnedAfterClaim = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after claim   : ${earnedAfterClaim}`);
    expect(
      parseFloat(earnedAfterClaim),
      "✖️ Earned after claim not right"
    ).to.eq(0);

    const balanceOfRewardsAfterClaim = await fullPandoraToken.balanceOf(
      owner.address
    );
    console.log(
      `   ➡️ Reward balance of owner after claim   : ${balanceOfRewardsAfterClaim}`
    );
    expect(
      parseFloat(balanceOfRewardsAfterClaim),
      "✖️ Balance should be a bit higher than saved amount"
    ).to.be.greaterThan(parseFloat(earnedAfter100days));
  });

  it("should withdraw and then claim rewards", async () => {
    const toDeposit = ethers.utils.parseEther("1");
    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, toDeposit);
    await stakerContract.connect(owner).deposit(toDeposit);

    //travelling 101 days into the future
    time_travel(101 * DAY);

    const earnedAfter100days = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after 100 days : ${earnedAfter100days}`);

    const withdrawTx = await stakerContract.connect(owner).withdraw(toDeposit);
    const withdrawRc = await withdrawTx.wait();
    const ev = withdrawRc.events.find((evInfo) => evInfo.event == "Withdrawn");
    const [evSender, evAmount] = ev.args;

    const gasCostInEth = (withdrawRc.gasUsed * gweiVirtual) / 10 ** 9;

    console.log(`   ➡️ Withdraw cost : ${gasCostInEth} ETH`);

    await stakerContract.connect(owner).claimRewards();
    const balanceOfRewardsAfterClaim = await fullPandoraToken.balanceOf(
      owner.address
    );
    console.log(
      `   ➡️ Reward balance of owner after claim   : ${balanceOfRewardsAfterClaim}`
    );
    expect(
      parseFloat(balanceOfRewardsAfterClaim),
      "✖️ Balance should be a bit higher than saved amount"
    ).to.be.greaterThan(parseFloat(earnedAfter100days));
  });

  it("should exit completely", async () => {
    const toDeposit = ethers.utils.parseEther("1");
    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, toDeposit);
    await stakerContract.connect(owner).deposit(toDeposit);

    //travelling 101 days into the future
    time_travel(101 * DAY);

    const earnedAfter100days = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after 100 days : ${earnedAfter100days}`);

    const exitTx = await stakerContract.connect(owner).exit();
    const exitRc = await exitTx.wait();

    const gasCostInEth = (exitRc.gasUsed * gweiVirtual) / 10 ** 9;

    console.log(`   ➡️ Exit cost : ${gasCostInEth} ETH`);

    const balanceOfRewardsAfterClaim = await fullPandoraToken.balanceOf(
      owner.address
    );
    console.log(
      `   ➡️ Reward balance of owner after exit   : ${balanceOfRewardsAfterClaim}`
    );
    expect(
      parseFloat(balanceOfRewardsAfterClaim),
      "✖️ Balance should be a bit higher than saved amount"
    ).to.be.greaterThan(parseFloat(earnedAfter100days));
  });

  it("should do multiple deposits", async () => {
    const toDeposit = ethers.utils.parseEther("1");
    await fullStableToken
      .connect(owner)
      .approve(fullStakerContract.address, ethers.utils.parseEther("10"));
    const depositTx = await stakerContract.connect(owner).deposit(toDeposit);
    const depositRc = await depositTx.wait();
    const gasCostInEth = (depositRc.gasUsed * gweiVirtual) / 10 ** 9;
    console.log(`   ➡️ Deposit cost : ${gasCostInEth} ETH`);
    //travelling 101 days into the future
    time_travel(101 * DAY);

    const earnedAfter100days = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after 100 days : ${earnedAfter100days}`);

    await stakerContract.connect(owner).deposit(toDeposit);
    //travelling 101 days into the future
    time_travel(101 * DAY);

    const earnedAfter200days = await stakerContract.earned(owner.address);
    console.log(`   ➡️ Earned amount after 200 days : ${earnedAfter200days}`);
    await stakerContract.connect(owner).deposit(toDeposit);
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

  const tokenFactory = await ethers.getContractFactory("PandoraToken");
  fullPandoraToken = await tokenFactory
    .connect(owner)
    .deploy("T", "T", rewardAmounts);

  const stableFactory = await ethers.getContractFactory("PandoraUSD");
  fullStableToken = await stableFactory
    .connect(owner)
    .deploy(fullManagerContainer.address);

  const stakerFactory = await ethers.getContractFactory("Staker");
  fullStakerContract = await stakerFactory
    .connect(owner)
    .deploy(fullStableToken.address, fullPandoraToken.address, 0);

  await fullStableToken.connect(owner).mint(owner.address, rewardAmounts, 18);

  await fullPandoraToken
    .connect(owner)
    .transfer(fullStakerContract.address, rewardAmounts);
  await fullPandoraToken.approve(fullStakerContract.address, rewardAmounts);
  await fullStakerContract.connect(owner).addRewards(rewardAmounts);
}
