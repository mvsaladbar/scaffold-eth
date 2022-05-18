// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for a strategy
/// @author Cosmin Grigore (@gcosmintech)
interface IStrategy {
    //TODO: add asset & token in as separate amounts
    /// @notice emitted when funds are deposited
    event Deposit(
        address indexed asset,
        address indexed tokenIn,
        uint256 assetAmount,
        uint256 tokenInAmount,
        uint256 shares,
        address indexed recipient
    );

    //TODO: add asset & token in as separate amounts
    /// @notice emitted when funds are withdrawn
    event Withdraw(
        address indexed asset,
        address indexed recipient,
        uint256 shares,
        uint256 amount
    );

    /// @notice emitted when rewards are withdrawn
    event Rewards(
        address indexed recipient,
        uint256[] rewards,
        address[] rewardTokens
    );

    /// @notice participants info
    struct RecipientInfo {
        uint256 investedAmount;
        uint256 totalShares;
    }

    //returns investments details
    function recipients(address _recipient)
        external
        view
        returns (uint256, uint256);

    //returns the address of the token accepted by the strategy as input
    function tokenIn() external view returns (address);

    //returns the address of strategy's receipt token
    function tokenOut() external view returns (address);

    //returns the address of strategy's receipt token
    function rewardToken() external view returns (address);

    /// @notice returns true if tokenOut exists in holding
    function holdingHasTokenOutBalance() external view returns (bool);

    //returns rewards amount
    function getRewards(address _recipient) external view returns (uint256);

    /// @notice deposits funds into the strategy
    /// @dev some strategies won't give back any receipt tokens; in this case 'tokenOutAmount' will be 0
    /// @dev 'tokenInAmount' will be equal to '_amount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _asset token to be invested
    /// @param _amount token's amount
    /// @param _recipient on behalf of
    /// @param _data extra data
    /// @return tokenOutAmount receipt tokens amount/obtained shares
    /// @return tokenInAmount returned token in amount
    function deposit(
        address _asset,
        uint256 _amount,
        address _recipient,
        bytes calldata _data
    ) external returns (uint256 tokenOutAmount, uint256 tokenInAmount);

    /// @notice withdraws deposited funds
    /// @dev some strategies will allow only the tokenIn to be withdrawn
    /// @dev 'assetAmount' will be equal to 'tokenInAmount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _asset token to be invested
    /// @param _shares amount to withdraw
    /// @param _recipient on behalf of
    /// @param _asset token to be withdrawn
    /// @param _data extra data
    /// @return assetAmount returned asset amoumt obtained from the operation
    /// @return tokenInAmount returned token in amount
    function withdraw(
        uint256 _shares,
        address _recipient,
        address _asset,
        bytes calldata _data
    ) external returns (uint256 assetAmount, uint256 tokenInAmount);

    /// @notice claims rewards from the strategy
    /// @param _recipient on behalf of
    /// @param _data extra data
    /// @return amounts reward tokens amounts
    /// @return tokens reward tokens addresses
    function claimRewards(address _recipient, bytes calldata _data)
        external
        returns (uint256[] memory amounts, address[] memory tokens);
}
