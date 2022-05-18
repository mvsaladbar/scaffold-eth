// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Curve3PoolBase.sol";

/// @title Curve3Pool strategy
/// @author Cosmin Grigore (@gcosmintech)
contract Curve3Pool is IStrategy, Curve3PoolBase {
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

    /// @notice Constructor
    /// @param _lpVault The LP Vault contract from Curve where underlying assets are deposited in exchange of an LP
    /// @param _tokenIn The LP token
    /// @param _gauge The gauge contract from Curve where LPs are staked for rewards
    /// @param _minter The minter contract from Curve, used to claim rewards in CRV Token
    /// @param _curveLpGetter The LP getter contract's address
    /// @param _managerContainer contract that contains the address of the manager contract
    constructor(
        address _lpVault,
        address _tokenIn,
        address _gauge,
        address _minter,
        address _curveLpGetter,
        address _managerContainer
    ) {
        require(_lpVault != address(0), "3021");
        require(_tokenIn != address(0), "3001");
        require(_gauge != address(0), "3022");
        require(_minter != address(0), "3023");
        require(_curveLpGetter != address(0), "3024");
        require(_managerContainer != address(0), "3065");

        managerContainer = IManagerContainer(_managerContainer);
        lpVault = ICurve3LiquidityPool(_lpVault);
        lpGauge = ICurve3PoolGauge(_gauge);
        curveMinter = ICurveMinter(_minter);

        curveLPGetter = ICurve3PoolLPGetter(_curveLpGetter);

        tokenOut = address(0);
        tokenIn = _tokenIn;
        rewardToken = lpGauge.crv_token();
    }

    /// @notice sets the new address
    /// @param _newAddr the new address
    function setGauge(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit GaugeUpdated(address(lpGauge), _newAddr);
        lpGauge = ICurve3PoolGauge(_newAddr);
        rewardToken = lpGauge.crv_token();
    }

    /// @notice returns rewards for recipient
    /// @param _recipient holder's address
    /// @return amount
    function getRewards(address _recipient)
        external
        pure
        override
        onlyValidAddress(_recipient)
        returns (uint256)
    {
        revert("3052");
    }

    /// @notice returns rewards for recipient
    /// @param _recipient holder's address
    /// @return amount
    function getRewardsNonView(address _recipient)
        external
        onlyValidAddress(_recipient)
        returns (uint256)
    {
        return lpGauge.claimable_tokens(_recipient);
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
            lpAmount = _wrap(_asset, _amount, minAmount, curveLPGetter);
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
    /// returns asset amoumt obtained from the operation
    /// returns token in amount
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
            result = _unwrap(
                _asset,
                tokenIn,
                lpResult,
                minAmount,
                curveLPGetter
            );
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
    function claimRewards(address _recipient, bytes calldata)
        external
        override
        onlyStrategyManager
        nonReentrant
        returns (uint256[] memory, address[] memory)
    {
        uint256[] memory rewardsResult = new uint256[](1);
        address[] memory rewardTokensResult = new address[](1);
        rewardTokensResult[0] = rewardToken;

        uint256 _rewards = _claimRewards(
            rewardToken,
            _recipient,
            address(lpGauge)
        );
        rewardsResult[0] = _rewards;
        emit Rewards(_recipient, rewardsResult, rewardTokensResult);
        return (rewardsResult, rewardTokensResult);
    }
}
