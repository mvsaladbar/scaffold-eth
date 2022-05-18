// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../interfaces/core/IHolding.sol";
import "../../interfaces/convex/IConvexBooster.sol";
import "../../interfaces/convex/IConvexBaseRewardPool.sol";
import "../../interfaces/convex/IConvexZap.sol";

import "../StrategyBase.sol";

/// @title ConvexBase contract used for any Convex strategy
/// @author Cosmin Grigore (@gcosmintech)
abstract contract ConvexBase is Ownable, ReentrancyGuard, StrategyBase {
    using SafeERC20 for IERC20;

    event ConvexPidUpdated(uint256 _old, uint256 _new);
    /// @notice emitted when the address is updated
    event RewardTokenUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event ConvexBoosterUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event ConvexRewardPoolUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event ConvexZapUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event LpGetterUpdated(address indexed _old, address indexed _new);

    /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );
    /// @notice underlying tokens for obtaining the tokenIn LP one
    mapping(address => bool) public whitelistedUnderlyingTokenIn;

    /// @notice convex booster pid
    uint256 public pid;
    /// @notice convex booster
    IConvexBooster public convexBooster;
    /// @notice convex rewrad pool
    IConvexBaseRewardPool public convexBaseRewardPool;
    /// @notice convex ClaimZap contract
    IConvexZap public convexZap;

    /// @notice total investments for the strategy
    uint256 public totalInvestments;

    /// @notice sets the new value
    /// @param _newAddr the new address
    function setConvexZap(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit ConvexZapUpdated(address(convexZap), _newAddr);
        convexZap = IConvexZap(_newAddr);
    }

    /// @notice sets the new value
    /// @param _newVal the new value
    function setConvexPid(uint256 _newVal) external onlyOwner {
        emit ConvexPidUpdated(pid, _newVal);
        pid = _newVal;
    }

    /// @notice adds an underlying token
    /// @param _asset the new address
    function addUnderlying(address _asset)
        external
        onlyValidAddress(_asset)
        onlyOwner
    {
        whitelistedUnderlyingTokenIn[_asset] = true;
        emit UnderlyingAdded(_asset);
    }

    /// @notice removes an underlying token
    /// @param _asset the new address
    function removeUnderlying(address _asset)
        external
        onlyValidAddress(_asset)
        onlyOwner
    {
        whitelistedUnderlyingTokenIn[_asset] = false;
        emit UnderlyingRemoved(_asset);
    }

    /// @notice get rewards
    /// @param _recipient holding contract
    /// @return main rewards
    function _getRewards(address _recipient) internal view returns (uint256) {
        return convexBaseRewardPool.rewards(_recipient);
    }

    /// @notice deposits into the strategy
    /// @param _tokenIn token's address
    /// @param _amount amount to be invested
    /// @param _recipient holding address
    /// @return obtained shares
    function _deposit(
        address _tokenIn,
        uint256 _amount,
        address _recipient
    ) internal returns (uint256) {
        uint256 sharesBefore = convexBaseRewardPool.balanceOf(_recipient);

        IHolding(_recipient).approve(_tokenIn, address(convexBooster), _amount);
        IHolding(_recipient).genericCall(
            address(convexBooster),
            abi.encodeWithSignature(
                "deposit(uint256,uint256,bool)",
                pid,
                _amount,
                true
            )
        );
        uint256 sharesAfter = convexBaseRewardPool.balanceOf(_recipient);
        require(sharesAfter > sharesBefore, "3028");
        return sharesAfter - sharesBefore;
    }

    /// @notice withdraws investments and rewards from a strategy
    /// @param _tokenIn token's address
    /// @param _shares amount to be withdrawn
    /// @param _recipient holding address
    /// @return obtained asset's amount
    function _withdraw(
        address _tokenIn,
        uint256 _shares,
        address _recipient
    ) internal returns (uint256) {
        uint256 assetsBefore = IERC20(_tokenIn).balanceOf(_recipient);

        IHolding(_recipient).genericCall(
            address(convexBaseRewardPool),
            abi.encodeWithSignature(
                "withdrawAndUnwrap(uint256,bool)",
                _shares,
                false
            )
        );
        uint256 assetsAfter = IERC20(_tokenIn).balanceOf(_recipient);
        require(assetsAfter > assetsBefore, "2006");

        IHolding(_recipient).transfer(
            _tokenIn,
            address(this),
            assetsAfter - assetsBefore
        );

        return assetsAfter - assetsBefore;
    }

    /// @notice claims rewards from Convex
    /// @dev Convex can give you multiple reward tokens
    /// @param _recipient holding address
    /// @param _data extra data
    function _claimRewards(address _recipient, bytes calldata _data)
        internal
        returns (uint256[] memory, address[] memory)
    {
        (
            uint256[] memory balancesBefore,
            address[] memory _tokens
        ) = _executeClaimZap(_recipient, _data);
        uint256[] memory balancesAfter = new uint256[](_tokens.length);
        uint256[] memory results = new uint256[](_tokens.length);

        for (uint256 i = 0; i < _tokens.length; i++) {
            balancesAfter[i] = IERC20(_tokens[i]).balanceOf(_recipient);

            uint256 fee = 0;
            uint256 _amount = balancesAfter[i] - balancesBefore[i];

            if (_amount > 0) {
                (uint256 performanceFee, , ) = _getStrategyManager()
                    .strategyInfo(address(this));

                fee = OperationsLib.getFeeAbsolute(_amount, performanceFee);
                if (fee > 0) {
                    address feeAddr = _getManager().feeAddress();
                    require(feeAddr != address(0), "3060");

                    IHolding(_recipient).transfer(_tokens[i], feeAddr, fee);
                    emit FeeTaken(_tokens[i], feeAddr, fee);
                }
            }

            results[i] = _amount - fee;
        }

        return (results, _tokens);
    }

    struct ClaimTempData {
        address[] rewardContracts;
        address[] extraRewardContracts;
        address[] tokenRewardContracts;
        address[] tokens;
        address[] tokenRewardTokens;
        bytes extras;
    }
    struct ClaimExtrasTempData {
        uint256 depositCrvMaxAmount;
        uint256 minAmountOut;
        uint256 depositCvxMaxAmount;
        uint256 spendCvxAmount;
        uint256 options;
    }

    function _executeClaimZap(address _recipient, bytes calldata _data)
        private
        returns (uint256[] memory, address[] memory)
    {
        ClaimTempData memory tempData;

        (
            tempData.rewardContracts,
            tempData.extraRewardContracts,
            tempData.tokenRewardContracts,
            tempData.tokens,
            tempData.tokenRewardTokens,
            tempData.extras
        ) = abi.decode(
            _data,
            (address[], address[], address[], address[], address[], bytes)
        );

        ClaimExtrasTempData memory extrasTempData;
        (
            extrasTempData.depositCrvMaxAmount,
            extrasTempData.minAmountOut,
            extrasTempData.depositCvxMaxAmount,
            extrasTempData.spendCvxAmount,
            extrasTempData.options
        ) = abi.decode(
            tempData.extras,
            (uint256, uint256, uint256, uint256, uint256)
        );

        require(
            tempData.rewardContracts.length == tempData.tokens.length,
            "2001"
        );
        require(tempData.rewardContracts.length > 0, "2100");

        uint256[] memory balancesBefore = new uint256[](tempData.tokens.length);
        for (uint256 i = 0; i < tempData.tokens.length; i++) {
            balancesBefore[i] = IERC20(tempData.tokens[i]).balanceOf(
                _recipient
            );
        }
        (bool success, ) = IHolding(_recipient).genericCall(
            address(convexZap),
            abi.encodeWithSignature(
                "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256,uint256)",
                tempData.rewardContracts,
                tempData.extraRewardContracts,
                tempData.tokenRewardContracts,
                tempData.tokenRewardTokens,
                extrasTempData.depositCrvMaxAmount,
                extrasTempData.minAmountOut,
                extrasTempData.depositCvxMaxAmount,
                extrasTempData.spendCvxAmount,
                extrasTempData.options
            )
        );
        require(success, "3037");
        return (balancesBefore, tempData.tokens);
    }
}
