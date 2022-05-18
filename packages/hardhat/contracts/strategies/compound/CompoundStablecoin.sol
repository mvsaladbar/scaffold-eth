// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../interfaces/compound/ICompoundToken.sol";
import "../../interfaces/core/IHolding.sol";
import "../StrategyBase.sol";

/// @title CompoundStablecoin strategy used for USDC,USDT,DAI or other stables
/// @author Cosmin Grigore (@gcosmintech)
contract CompoundStablecoin is IStrategy, StrategyBase {
    using SafeERC20 for IERC20;

    /// @notice emitted when the address is updated
    event CompoundTokenUpdated(address indexed _old, address indexed _new);

    /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );

    /// @notice the stablecoin token to invest
    address public immutable override tokenIn;

    /// @notice the Compound receipt token
    address public immutable override tokenOut;

    /// @notice reward tokens offered to users
    address public override rewardToken;

    /// @notice returns true if tokenOut is transferred to holding
    bool public override holdingHasTokenOutBalance;

    /// @notice participants details
    mapping(address => IStrategy.RecipientInfo) public override recipients;

    /// @notice total investments for the strategy
    uint256 public totalInvestments;

    /// @notice creates a CompoundStablecoin strategy
    /// @param _managerContainer contract that contains the address of the manager contract
    /// @param _compoundToken curve LP wrapper
    constructor(address _managerContainer, address _compoundToken) {
        require(_compoundToken != address(0), "3038");
        require(_managerContainer != address(0), "3065");

        managerContainer = IManagerContainer(_managerContainer);

        tokenIn = ICompoundToken(_compoundToken).underlying();
        tokenOut = _compoundToken;
        rewardToken = ICompoundToken(_compoundToken).underlying();
    }

    /// @notice returns rewards for recipient
    /// @param _recipient holder's address
    /// @return totalRewards
    function getRewards(address _recipient)
        external
        view
        override
        returns (uint256 totalRewards)
    {
        uint256 exchangeRate = ICompoundToken(tokenOut).exchangeRateStored();

        uint256 tokenValueOfShares = (recipients[_recipient].totalShares *
            exchangeRate) / 1e18;
        totalRewards = recipients[_recipient].investedAmount >
            tokenValueOfShares
            ? 0
            : tokenValueOfShares - recipients[_recipient].investedAmount;
    }

    /// @notice deposits funds into the strategy
    /// @param _asset asset to be invested
    /// @param _amount amount to be invested
    /// @param _recipient holder's address
    /// @return tokenOutAmount returned receipt tokens amount
    /// @return tokenInAmount returned token in amount
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

        uint256 _shares = _deposit(_recipient, _amount);

        recipients[_recipient].investedAmount += _amount;
        recipients[_recipient].totalShares += _shares;
        totalInvestments += _amount;

        emit Deposit(_asset, tokenIn, _amount, _amount, _shares, _recipient);

        return (_shares, _amount);
    }

    /// @notice withdraws investments and rewards from a strategy
    /// @param _shares amount to be invested
    /// @param _recipient holder's address
    /// @param _asset token to be extracted address
    /// @return obtained amount
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
        require(recipients[_recipient].totalShares >= _shares, "2005");
        require(_asset == tokenIn, "3001");

        uint256 fractionWithdrawn = 1e18;

        if (_shares < recipients[_recipient].totalShares) {
            fractionWithdrawn = OperationsLib.getRatio(
                _shares,
                recipients[_recipient].totalShares,
                18
            );
        }
        uint256 rewardPortion = (this.getRewards(_recipient) *
            fractionWithdrawn) / 1e18;

        (uint256 performanceFee, , ) = _getStrategyManager().strategyInfo(
            address(this)
        );
        uint256 fee = OperationsLib.getFeeAbsolute(
            rewardPortion,
            performanceFee
        );
        uint256 result = _withdraw(_recipient, _shares);

        recipients[_recipient].totalShares -= _shares;
        recipients[_recipient].investedAmount = result >
            recipients[_recipient].investedAmount
            ? 0
            : recipients[_recipient].investedAmount - result;
        totalInvestments = result > totalInvestments
            ? 0
            : totalInvestments - result;

        if (fee > 0) {
            address feeAddr = _getManager().feeAddress();
            require(feeAddr != address(0), "3060");
            IHolding(_recipient).transfer(rewardToken, feeAddr, fee);
            emit FeeTaken(rewardToken, feeAddr, fee);

            result -= fee;
        }
        emit Withdraw(_asset, _recipient, _shares, result);

        return (result, result);
    }

    /// @notice claims rewards from the strategy
    /// @dev doesn't do anything; Compound sends the same token when withdrawing; use withdraw
    function claimRewards(address, bytes calldata)
        external
        view
        override
        onlyStrategyManager
        returns (uint256[] memory, address[] memory)
    {
        revert("3049");
    }

    /// @notice deposits into the strategy
    /// @param _recipient address of the holding
    /// @param _amount amount to be invested
    /// @return obtained shares
    function _deposit(address _recipient, uint256 _amount)
        internal
        returns (uint256)
    {
        uint256 sharesBefore = ICompoundToken(tokenOut).balanceOf(_recipient);

        IHolding(_recipient).approve(tokenIn, tokenOut, _amount);
        IHolding(_recipient).genericCall(
            tokenOut,
            abi.encodeWithSignature("mint(uint256)", _amount)
        );
        uint256 sharesAfter = ICompoundToken(tokenOut).balanceOf(_recipient);
        require(sharesAfter > sharesBefore, "3030");
        return sharesAfter - sharesBefore;
    }

    /// @notice withdraws investments and rewards from a strategy
    /// @param _recipient address of the holding
    /// @param _shares amount to be withdrawn
    /// @return obtained asset's amount
    function _withdraw(address _recipient, uint256 _shares)
        internal
        returns (uint256)
    {
        require(
            ICompoundToken(tokenOut).balanceOf(_recipient) >= _shares,
            "2005"
        );

        uint256 assetsBefore = IERC20(tokenIn).balanceOf(_recipient);

        IHolding(_recipient).genericCall(
            tokenOut,
            abi.encodeWithSignature("redeem(uint256)", _shares)
        );
        uint256 assetsAfter = IERC20(tokenIn).balanceOf(_recipient);
        require(assetsAfter > assetsBefore, "3016");

        return assetsAfter - assetsBefore;
    }
}
