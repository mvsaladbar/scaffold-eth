// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../StrategyBase.sol";

import "../../../interfaces/core/IHolding.sol";
import "../../../interfaces/yearn/IYearnVault.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title YearnStablecoin strategy used for USDC,USDT,DAI or other stables
/// @author Cosmin Grigore (@gcosmintech)
contract YearnStablecoin is IStrategy, StrategyBase {
    using SafeERC20 for IERC20;

    /// @notice the LP token
    address public immutable override tokenIn;
    /// @notice the  receipt token
    address public immutable override tokenOut;
    /// @notice reward tokens offered to users
    address public override rewardToken;
    /// @notice returns true if tokenOut is transferred to holding
    bool public override holdingHasTokenOutBalance;

    mapping(address => IStrategy.RecipientInfo) public override recipients;

    IYearnVault public immutable yearnVault;

    /// @notice total investments for the strategy
    uint256 public totalInvestments;

    /// @notice emitted when the address is updated
    event YearnVaultUpdated(address indexed _old, address indexed _new);

    /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );

    /// @notice creates a YearnStablecoin strategy
    /// @param _yearnVault yearn vault address
    /// @param _managerContainer contract that contains the address of the manager contract
    constructor(address _yearnVault, address _managerContainer) {
        require(_managerContainer != address(0), "3065");
        managerContainer = IManagerContainer(_managerContainer);

        require(_yearnVault != address(0), "3048");
        yearnVault = IYearnVault(_yearnVault);

        tokenIn = IYearnVault(_yearnVault).token();
        tokenOut = _yearnVault;
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
        uint256 balance = yearnVault.balanceOf(_recipient);
        uint256 pricePerShare = yearnVault.pricePerShare();
        uint256 tokenValueOfShares = (balance * pricePerShare) /
            (10**yearnVault.decimals());

        uint256 totalRewards = recipients[_recipient].investedAmount >
            tokenValueOfShares
            ? 0
            : tokenValueOfShares - recipients[_recipient].investedAmount;
        return totalRewards;
    }

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
        onlyStrategyManager
        nonReentrant
        onlyValidAmount(_amount)
        returns (uint256, uint256)
    {
        require(_amount > 0, "2001");
        require(_asset == tokenIn, "3001");

        IHolding(_recipient).transfer(_asset, address(this), _amount);
        OperationsLib.safeApprove(_asset, address(yearnVault), _amount);
        uint256 shares = yearnVault.deposit(_amount, _recipient);

        // solhint-disable-next-line reentrancy
        recipients[_recipient].investedAmount += _amount;
        // solhint-disable-next-line reentrancy
        recipients[_recipient].totalShares += shares;
        // solhint-disable-next-line reentrancy
        totalInvestments += _amount;

        emit Deposit(_asset, tokenIn, _amount, _amount, shares, _recipient);

        return (shares, _amount);
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
        nonReentrant
        onlyValidAmount(_shares)
        returns (uint256, uint256)
    {
        require(recipients[_recipient].totalShares >= _shares, "2005");
        require(_asset == tokenIn, "3001");

        uint256 maxLoss = 0;
        if (_data.length > 0) {
            maxLoss = abi.decode(_data, (uint256));
        }

        uint256 shareRatio = OperationsLib.getRatio(
            _shares,
            recipients[_recipient].totalShares,
            yearnVault.decimals()
        );
        uint256 investment = (recipients[_recipient].investedAmount *
            shareRatio) / (10**yearnVault.decimals());

        IHolding(_recipient).transfer(tokenOut, address(this), _shares);
        OperationsLib.safeApprove(tokenOut, address(yearnVault), _shares);
        uint256 result = yearnVault.withdraw(_shares, _recipient, maxLoss); //up to maxLoss accepted loss (10 = 1%)

        // solhint-disable-next-line reentrancy
        recipients[_recipient].totalShares -= _shares;
        // solhint-disable-next-line reentrancy
        recipients[_recipient].investedAmount = result >
            recipients[_recipient].investedAmount
            ? 0
            : recipients[_recipient].investedAmount - result;

        // solhint-disable-next-line reentrancy
        totalInvestments = result > totalInvestments
            ? 0
            : totalInvestments - result;

        uint256 rewardPortion = (this.getRewards(_recipient) * shareRatio) /
            (10**yearnVault.decimals());

        if (rewardPortion > 0) {
            // If there is a reward we take the fee
            (uint256 performanceFee, , ) = _getStrategyManager().strategyInfo(
                address(this)
            );
            uint256 fee = OperationsLib.getFeeAbsolute(
                rewardPortion,
                performanceFee
            );

            if (fee > 0) {
                address feeAddr = _getManager().feeAddress();
                require(feeAddr != address(0), "3060");
                IHolding(_recipient).transfer(_asset, feeAddr, fee);
                emit FeeTaken(_asset, feeAddr, fee);

                result -= fee;
            }
        }

        emit Withdraw(_asset, _recipient, _shares, result);

        return (result, investment);
    }

    /// @notice claims rewards from the strategy
    /// @dev doesn't do anything; Yearn sends the same token when withdrawing; use withdraw
    function claimRewards(address, bytes calldata)
        external
        view
        override
        onlyStrategyManager
        returns (uint256[] memory, address[] memory)
    {
        revert("3049");
    }
}
