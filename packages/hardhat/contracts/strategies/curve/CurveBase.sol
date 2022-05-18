// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../interfaces/core/IHolding.sol";
import "../../interfaces/curve/ICurveMinter.sol";

import "../StrategyBase.sol";

/// @title CurveBase contract used for any Curve strategies
/// @author Cosmin Grigore (@gcosmintech)
abstract contract CurveBase is Ownable, ReentrancyGuard, StrategyBase {
    using SafeERC20 for IERC20;

    /// @notice emitted when the address is updated
    event CurveLpGetterUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event RewardTokenUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event GaugeUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event VaultUpdated(address indexed _old, address indexed _new);
    /// @notice emitted when the address is updated
    event MinterUpdated(address indexed _old, address indexed _new);
    /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );

    /// @notice rewards curve minter
    ICurveMinter public curveMinter;

    /// @notice underlying tokens for obtaining the tokenIn LP one
    mapping(address => bool) public whitelistedUnderlyingTokenIn;
    /// @notice total investments for the strategy
    uint256 public totalInvestments;

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

    /// @notice sets the new address
    /// @param _newAddr the new address
    function setTricryptoMinter(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit MinterUpdated(address(curveMinter), _newAddr);
        curveMinter = ICurveMinter(_newAddr);
    }

    function _claimRewards(
        address _rewardToken,
        address _recipient,
        address _gauge
    ) internal returns (uint256) {
        uint256 balanceBefore = IERC20(_rewardToken).balanceOf(_recipient);
        (bool success, ) = IHolding(_recipient).genericCall(
            address(curveMinter),
            abi.encodeWithSignature("mint(address)", _gauge)
        );
        require(success, "3037");
        uint256 balanceAfter = IERC20(_rewardToken).balanceOf(_recipient);

        uint256 result = balanceAfter - balanceBefore;
        (uint256 performanceFee, , ) = _getStrategyManager().strategyInfo(
            address(this)
        );

        uint256 fee = OperationsLib.getFeeAbsolute(result, performanceFee);
        if (fee > 0) {
            address feeAddr = _getManager().feeAddress();
            require(feeAddr != address(0), "3060");

            IHolding(_recipient).transfer(_rewardToken, feeAddr, fee);
            emit FeeTaken(_rewardToken, feeAddr, fee);
            result -= fee;
        }

        return result;
    }
}
