// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Convex3PoolBase.sol";
import "../../../interfaces/core/IHolding.sol";

/// @title Convex3Pool strategy used for 3pool
/// @author Cosmin Grigore (@gcosmintech)
contract Convex3Pool is IStrategy, Convex3PoolBase {
    using SafeERC20 for IERC20;

    /// @notice the LP token
    address public immutable override tokenIn;
    /// @notice the Convex receipt token
    address public immutable override tokenOut;
    /// @notice reward tokens offered to users
    address public override rewardToken;
    /// @notice returns true if tokenOut is transferred to holding
    bool public override holdingHasTokenOutBalance;

    /// @notice participants details
    mapping(address => IStrategy.RecipientInfo) public override recipients;

    /// @notice custom contract for obtaining tokenIn
    ICurve3PoolLPGetter public lpGetter;

    /// @notice creates a ConvexStablecoin strategy
    /// @param _pid pid to be used by convex booster
    /// @param _convexBooster convex booster address
    /// @param _convexRewardPool convex base reward pool address
    /// @param _convexZap convex ClaimZap
    /// @param _curveLpGetter curve LP wrapper
    /// @param _managerContainer contract that contains the address of the manager contract
    constructor(
        uint256 _pid,
        address _convexBooster,
        address _convexRewardPool,
        address _convexZap,
        address _curveLpGetter,
        address _managerContainer
    ) {
        require(_convexBooster != address(0), "3040");
        convexBooster = IConvexBooster(_convexBooster);

        require(_convexRewardPool != address(0), "3041");
        convexBaseRewardPool = IConvexBaseRewardPool(_convexRewardPool);

        require(_convexZap != address(0), "3042");
        convexZap = IConvexZap(_convexZap);

        require(_curveLpGetter != address(0), "3024");
        lpGetter = ICurve3PoolLPGetter(_curveLpGetter);

        require(_pid < convexBooster.poolLength(), "3043");
        pid = _pid;

        tokenIn = convexBooster.poolInfo(pid).lptoken;
        tokenOut = convexBooster.poolInfo(pid).token;
        rewardToken = convexBaseRewardPool.rewardToken();

        require(_managerContainer != address(0), "3065");
        managerContainer = IManagerContainer(_managerContainer);
    }

    /// @notice sets the new value
    /// @param _newAddr the new address
    function setConvexRewardPool(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit ConvexRewardPoolUpdated(address(convexBaseRewardPool), _newAddr);
        convexBaseRewardPool = IConvexBaseRewardPool(_newAddr);
        rewardToken = convexBaseRewardPool.rewardToken();
    }

    /// @notice sets the new value
    /// @param _newAddr the new address
    function setLPGetter(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit LpGetterUpdated(address(lpGetter), _newAddr);
        lpGetter = ICurve3PoolLPGetter(_newAddr);
    }

    /// @notice returns rewards for recipient
    /// @param _recipient holder's address
    /// @return amount
    function getRewards(address _recipient)
        external
        view
        override
        onlyValidAddress(_recipient)
        returns (uint256)
    {
        return _getRewards(_recipient);
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
        bytes calldata _data
    )
        external
        override
        onlyValidAmount(_amount)
        onlyStrategyManager
        nonReentrant
        returns (uint256, uint256)
    {
        require(
            _asset == tokenIn || whitelistedUnderlyingTokenIn[_asset],
            "3001"
        );
        uint256 lpAmount = _amount;
        address depositToken = tokenIn;

        if (_asset != tokenIn && whitelistedUnderlyingTokenIn[_asset]) {
            IHolding(_recipient).transfer(_asset, address(this), _amount);
            uint256 minAmount = abi.decode(_data, (uint256));
            lpAmount = _wrap(_asset, _amount, minAmount, lpGetter);
            IERC20(depositToken).safeTransfer(_recipient, lpAmount);
        }

        uint256 shares = _deposit(depositToken, lpAmount, _recipient);

        // solhint-disable-next-line reentrancy
        recipients[_recipient].investedAmount += lpAmount;
        // solhint-disable-next-line reentrancy
        recipients[_recipient].totalShares += shares;

        totalInvestments += lpAmount;

        emit Deposit(_asset, tokenIn, _amount, lpAmount, shares, _recipient);

        return (shares, lpAmount);
    }

    /// @notice withdraws deposited funds
    /// @dev some strategies will allow only the tokenIn to be withdrawn
    /// @dev 'assetAmount' will be equal to 'tokenInAmount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _asset token to be invested
    /// @param _shares amount to withdraw
    /// @param _recipient on behalf of
    /// @param _asset token to be withdrawn
    /// @param _data extra data
    /// returns returned asset amoumt obtained from the operation
    /// returns returned token in amount
    function withdraw(
        uint256 _shares,
        address _recipient,
        address _asset,
        bytes calldata _data
    )
        external
        override
        onlyStrategyManager
        onlyValidAmount(_shares)
        nonReentrant
        returns (uint256, uint256)
    {
        require(recipients[_recipient].totalShares >= _shares, "2005");
        require(
            _asset == tokenIn || whitelistedUnderlyingTokenIn[_asset],
            "3001"
        );

        uint256 lpResult = _withdraw(tokenIn, _shares, _recipient);

        uint256 result = lpResult;
        if (_asset != tokenIn) {
            //we need to unwrap
            uint256 minAmount = abi.decode(_data, (uint256));
            result = _unwrap(_asset, tokenIn, lpResult, minAmount, lpGetter);
        }
        IERC20(_asset).safeTransfer(_recipient, result);

        recipients[_recipient].totalShares -= _shares;
        if (lpResult > recipients[_recipient].investedAmount) {
            recipients[_recipient].investedAmount = 0;
        } else {
            recipients[_recipient].investedAmount -= lpResult;
        }
        if (lpResult > totalInvestments) {
            totalInvestments = 0;
        } else {
            totalInvestments -= lpResult;
        }

        emit Withdraw(_asset, _recipient, _shares, lpResult);

        return (result, lpResult);
    }

    /// @notice claims rewards from the strategy
    /// @param _recipient on behalf of
    /// @param _data extra data
    function claimRewards(address _recipient, bytes calldata _data)
        external
        override
        onlyStrategyManager
        nonReentrant
        returns (uint256[] memory, address[] memory)
    {
        (uint256[] memory rewards, address[] memory tokens) = _claimRewards(
            _recipient,
            _data
        );

        emit Rewards(_recipient, rewards, tokens);
        return (rewards, tokens);
    }
}
