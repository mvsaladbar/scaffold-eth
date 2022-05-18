// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../StrategyBase.sol";

import "../../interfaces/core/IHolding.sol";
import "../../interfaces/aave/IAaveLendingPool.sol";
import "../../interfaces/aave/IAaveIncentivesController.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title AaveStablecoin strategy used for USDC,USDT,DAI or other stables
/// @author Cosmin Grigore (@gcosmintech)
contract AaveStablecoin is IStrategy, StrategyBase {
    using SafeERC20 for IERC20;

    /// @notice emitted when the address is updated
    event IncentivesControllerUpdated(
        address indexed _old,
        address indexed _new
    );
    /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );

    /// @notice emitted when the address is updated
    event LendingPoolUpdated(address indexed _old, address indexed _new);

    /// @notice emitted when the address is updated
    event RewardTokenUpdated(address indexed _old, address indexed _new);

    /// @notice the LP token
    address public immutable override tokenIn;
    /// @notice the Aave receipt token
    address public immutable override tokenOut;
    /// @notice reward tokens offered to users
    address public override rewardToken;

    /// @notice returns true if tokenOut is transferred to holding
    bool public override holdingHasTokenOutBalance;

    //TODO: remove if not useful for other strategies; or fill it for this one otherwise
    /// @notice participants details
    mapping(address => IStrategy.RecipientInfo) public override recipients;

    /// @notice Aave lending pool
    IAaveLendingPool public lendingPool;

    /// @notice Aave lending pool
    IAaveIncentivesController public incentivesController;

    /// @notice total investments for the strategy
    uint256 public totalInvestments;

    /// @notice creates an AaveStablecoin strategy
    /// @param _managerContainer contract that contains the address of the manager contract
    /// @param _lendingPool lending pool address
    /// @param _incentivesController incentives controller address
    /// @param _tokenIn token in address
    /// @param _tokenOut aToken address
    constructor(
        address _managerContainer,
        address _lendingPool,
        address _incentivesController,
        address _tokenIn,
        address _tokenOut
    ) {
        require(_managerContainer != address(0), "3065");
        require(_lendingPool != address(0), "3036");
        require(_incentivesController != address(0), "3039");
        managerContainer = IManagerContainer(_managerContainer);
        incentivesController = IAaveIncentivesController(_incentivesController);
        lendingPool = IAaveLendingPool(_lendingPool);
        rewardToken = incentivesController.REWARD_TOKEN();
        tokenIn = _tokenIn;
        tokenOut = _tokenOut;
    }

    // -- Owner specific methods --
    /// @notice sets the new value
    /// @param _newAddr the new address
    function setIncentivesController(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit IncentivesControllerUpdated(
            address(incentivesController),
            _newAddr
        );
        incentivesController = IAaveIncentivesController(_newAddr);
        rewardToken = incentivesController.REWARD_TOKEN();
    }

    /// @notice sets the new value
    /// @param _newAddr the new address
    function setLendingPool(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit LendingPoolUpdated(address(lendingPool), _newAddr);
        lendingPool = IAaveLendingPool(_newAddr);
    }

    // -- View type methods --
    /// @notice returns rewards for recipient based on existing balances
    /// @dev for an updated value, updateRewards() needs to be called by the recipient
    /// @param _recipient holder's address
    /// @return amount
    function getRewards(address _recipient)
        external
        view
        override
        onlyValidAddress(_recipient)
        returns (uint256)
    {
        return incentivesController.getUserUnclaimedRewards(_recipient);
    }

    // -- User specific methods --
    /// @notice deposits funds into the strategy
    /// @dev some strategies won't give back any receipt tokens; in this case 'tokenOutAmount' will be 0
    /// @dev 'tokenInAmount' will be equal to '_amount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _asset token to be invested
    /// @param _amount token's amount
    /// @param _recipient on behalf of
    /// returns receipt tokens amount/obtained shares
    /// returns tokenin() amount
    function deposit(
        address _asset,
        uint256 _amount,
        address _recipient,
        bytes calldata
    )
        external
        override
        onlyValidAmount(_amount)
        onlyStrategyManager
        nonReentrant
        returns (uint256, uint256)
    {
        require(_asset == tokenIn, "3001");

        IHolding(_recipient).transfer(_asset, address(this), _amount);

        uint256 balanceBefore = IERC20(tokenOut).balanceOf(_recipient);
        OperationsLib.safeApprove(_asset, address(lendingPool), _amount);
        lendingPool.deposit(_asset, _amount, _recipient, 0);
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(_recipient);

        // solhint-disable-next-line reentrancy
        recipients[_recipient].investedAmount += _amount;
        // solhint-disable-next-line reentrancy
        recipients[_recipient].totalShares += (balanceAfter - balanceBefore);
        // solhint-disable-next-line reentrancy
        totalInvestments += _amount;

        emit Deposit(
            _asset,
            tokenIn,
            _amount,
            _amount,
            balanceAfter - balanceBefore,
            _recipient
        );
        return (balanceAfter - balanceBefore, _amount);
    }

    /// @notice withdraws deposited funds
    /// @dev some strategies will allow only the tokenIn to be withdrawn
    /// @dev 'assetAmount' will be equal to 'tokenInAmount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _asset token to be invested
    /// @param _shares amount to withdraw
    /// @param _recipient on behalf of
    /// @param _asset token to be withdrawn
    /// returns asset amoumt obtained from the operation
    /// returns token in amount
    function withdraw(
        uint256 _shares,
        address _recipient,
        address _asset,
        bytes calldata
    )
        external
        override
        onlyStrategyManager
        onlyValidAmount(_shares)
        nonReentrant
        returns (uint256, uint256)
    {
        require(_asset == tokenIn, "3001");
        require(_shares <= IERC20(tokenOut).balanceOf(_recipient), "2002");

        uint256 shareRatio = OperationsLib.getRatio(
            _shares,
            recipients[_recipient].totalShares,
            IERC20Metadata(tokenOut).decimals()
        );

        uint256 investment = (recipients[_recipient].investedAmount *
            shareRatio) / (10**IERC20Metadata(tokenOut).decimals());

        IHolding(_recipient).transfer(tokenOut, address(this), _shares);
        uint256 balanceBefore = IERC20(tokenIn).balanceOf(_recipient);
        lendingPool.withdraw(_asset, _shares, _recipient);
        uint256 balanceAfter = IERC20(tokenIn).balanceOf(_recipient);
        uint256 result = balanceAfter - balanceBefore;

        // solhint-disable-next-line reentrancy
        recipients[_recipient].totalShares = _shares >
            recipients[_recipient].totalShares
            ? 0
            : recipients[_recipient].totalShares - _shares;
        // solhint-disable-next-line reentrancy
        recipients[_recipient].investedAmount = result >
            recipients[_recipient].investedAmount
            ? 0
            : recipients[_recipient].investedAmount - result;

        // solhint-disable-next-line reentrancy
        totalInvestments = result > totalInvestments
            ? 0
            : totalInvestments - result;

        emit Withdraw(_asset, _recipient, _shares, result);

        return (result, investment);
    }

    /// @notice claims rewards from the strategy
    /// @param _recipient on behalf of
    function claimRewards(address _recipient, bytes calldata)
        external
        override
        onlyStrategyManager
        nonReentrant
        returns (uint256[] memory, address[] memory)
    {
        uint256 fee = 0;
        uint256 _amount = incentivesController.getUserUnclaimedRewards(
            _recipient
        );

        uint256[] memory rewardsResult = new uint256[](1);
        address[] memory rewardTokensResult = new address[](1);
        rewardTokensResult[0] = rewardToken;

        if (_amount > 0) {
            address[] memory tokens = new address[](1);
            tokens[0] = tokenOut;

            (bool success, ) = IHolding(_recipient).genericCall(
                address(incentivesController),
                abi.encodeWithSignature(
                    "claimRewards(address[],uint256,address)",
                    tokens,
                    _amount,
                    _recipient
                )
            );
            require(success, "3037");

            (uint256 performanceFee, , ) = _getStrategyManager().strategyInfo(
                address(this)
            );

            fee = OperationsLib.getFeeAbsolute(_amount, performanceFee);
            if (fee > 0) {
                address feeAddr = _getManager().feeAddress();
                require(feeAddr != address(0), "3060");
                IHolding(_recipient).transfer(rewardToken, feeAddr, fee);

                emit FeeTaken(rewardToken, feeAddr, fee);
                _amount -= fee;
            }

            rewardsResult[0] = _amount;

            emit Rewards(_recipient, rewardsResult, rewardTokensResult);
        }

        return (rewardsResult, rewardTokensResult);
    }
}
