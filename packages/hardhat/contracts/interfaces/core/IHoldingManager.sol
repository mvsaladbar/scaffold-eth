// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IManagerContainer.sol";

interface IHoldingManager {
    /// @notice emitted when a new holding is crated
    event HoldingCreated(address indexed user, address indexed holdingAddress);

    /// @notice emitted when a new user is assigned for the holding contract
    event HoldingAssigned(
        address indexed holding,
        address indexed minter,
        address indexed user
    );

    event HoldingUninitialized(address indexed holding);

    /// @notice emitted when rewards are sent to the holding contract
    event ReceivedRewards(
        address indexed holding,
        address indexed strategy,
        address indexed token,
        uint256 amount
    );

    /// @notice emitted when rewards were exchanged to another token
    event RewardsExchanged(
        address indexed holding,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice emitted when rewards are withdrawn by the user
    event RewardsWithdrawn(
        address indexed holding,
        address indexed token,
        uint256 amount
    );

    /// @notice emitted when a deposit is created
    event Deposit(
        address indexed holding,
        address indexed token,
        uint256 amount
    );

    /// @notice event emitted when a borrow action was performed
    event Borrowed(
        address indexed holding,
        address indexed token,
        uint256 amount,
        uint256 fee,
        bool mintToUser
    );
    /// @notice event emitted when a repay action was performed
    event Repayed(
        address indexed holding,
        address indexed token,
        uint256 amount,
        bool repayFromUser
    );

    /// @notice event emitted when collateral is retrieved from a strategy in case of liquidation
    event CollateralRetrieved(
        address indexed token,
        address indexed holding,
        address indexed strategy,
        uint256 collateral
    );
    /// @notice event emitted when collateral is moved from liquidated holding to liquidating holding
    event CollateralMoved(
        address indexed token,
        address indexed holdingFrom,
        address indexed holdingTo,
        uint256 amount
    );

    /// @notice event emitted when fee is moved from liquidated holding to fee addres
    event CollateralFeeTaken(
        address token,
        address holdingFrom,
        address to,
        uint256 amount
    );

    /// @notice event emitted when self liquidation happened
    event SelfLiquidated(
        address indexed holding,
        address indexed token,
        uint256 amount,
        uint256 collateralUsed
    );

    /// @notice event emitted when borrow event happened for multiple users
    event BorrowedMultiple(
        address indexed holding,
        uint256 length,
        bool mintedToUser
    );
    /// @notice event emitted when a multiple repay operation happened
    event RepayedMultiple(
        address indexed holding,
        uint256 length,
        bool repayedFromUser
    );
    /// @notice event emitted when pause state is changed
    event PauseUpdated(bool oldVal, bool newVal);

    /// @notice data used for multiple borrow
    struct BorrowOrRepayData {
        address token;
        uint256 amount;
    }
    /// @notice properties used for self liquidation
    /// @dev self liquidation is when a user swaps collateral with the stablecoin
    struct SelfLiquidateData {
        address[] _strategies;
        bytes[] _strategiesData;
    }

    /// @notice properties used for holding liquidation
    struct LiquidateData {
        address[] _strategies;
        bytes[] _strategiesData;
        uint256 _maxLoss;
        bool _burnFromUser;
    }

    /// @notice returns the pause state of the contract
    function paused() external view returns (bool);

    /// @notice sets a new value for pause state
    /// @param _val the new value
    function setPaused(bool _val) external;

    /// @notice returns user for holding
    function holdingUser(address holding) external view returns (address);

    /// @notice returns holding for user
    function userHolding(address _user) external view returns (address);

    /// @notice returns true if holding was created
    function isHolding(address _holding) external view returns (bool);

    /// @notice interface of the manager container contract
    function managerContainer() external view returns (IManagerContainer);

    /// @notice mapping of minters of each holding (holding address => minter address)
    function holdingMinter(address) external view returns (address);

    /// @notice mapping of available holdings by position (position=>holding address)
    function availableHoldings(uint256) external view returns (address);

    /// @notice position of the first available holding
    function availableHoldingsHead() external view returns (uint256);

    /// @notice position of the last available holding
    function availableHoldingsTail() external view returns (uint256);

    /// @notice number of available holding contracts (tail - head)
    function numAvailableHoldings() external view returns (uint256);

    // -- User specific methods --

    /// @notice deposits a whitelisted token into the holding
    /// @param _token token's address
    /// @param _amount amount to deposit
    function deposit(address _token, uint256 _amount) external;

    /// @notice withdraws a token from the contract
    /// @param _token token user wants to withdraw
    /// @param _amount withdrawal amount
    function withdraw(address _token, uint256 _amount) external;

    /// @notice exchanges an existing token with a whitelisted one
    /// @param _ammId selected AMM id
    /// @param _tokenIn token available in the contract
    /// @param _tokenOut token resulting from the swap operation
    /// @param _amountIn exchange amount
    /// @param _minAmountOut min amount of tokenOut to receive when the swap is performed
    /// @param _data specific amm data
    /// @return the amount obtained
    function exchange(
        uint256 _ammId,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bytes calldata _data
    ) external returns (uint256);

    /// @notice mints stablecoin to the user or to the holding contract
    /// @param _token collateral token
    /// @param _amount the borrowed amount
    function borrow(
        address _token,
        uint256 _amount,
        bool _mintDirectlyToUser
    )
        external
        returns (
            uint256 part,
            uint256 share,
            uint256 fee
        );

    /// @notice borrows from multiple assets
    /// @param _data struct containing data for each collateral type
    /// @param _mintDirectlyToUser if true mints to user instead of holding
    function borrowMultiple(
        BorrowOrRepayData[] calldata _data,
        bool _mintDirectlyToUser
    ) external;

    /// @notice registers a repay operation
    /// @param _token collateral token
    /// @param _amount the repayed amount
    /// @param _repayFromUser if true it will burn from user's wallet, otherwise from user's holding
    function repay(
        address _token,
        uint256 _amount,
        bool _repayFromUser
    ) external returns (uint256 amount);

    /// @notice repays multiple assets
    /// @param _data struct containing data for each collateral type
    /// @param _repayFromUser if true it will burn from user's wallet, otherwise from user's holding
    function repayMultiple(
        BorrowOrRepayData[] calldata _data,
        bool _repayFromUser
    ) external;

    /// @notice method used to pay stablecoin debt by using own collateral
    /// @param _token token to be used as collateral
    /// @param _amount the amount of stablecoin to repay
    function selfLiquidate(
        address _token,
        uint256 _amount,
        SelfLiquidateData calldata _data
    ) external returns (uint256);

    /// @notice liquidate user
    /// @dev if user is solvent liquidation won't work
    /// @param _liquidatedHolding address of the holding which is being liquidated
    /// @param _token collateral token
    /// @param _data liquidation data
    /// @return result true if liquidation happened
    /// @return collateralAmount the amount of collateral to move
    /// @return protocolFeeAmount the protocol fee amount
    function liquidate(
        address _liquidatedHolding,
        address _token,
        LiquidateData calldata _data
    )
        external
        returns (
            bool result,
            uint256 collateralAmount,
            uint256 protocolFeeAmount
        );

    /// @notice creates holding and leaves it available to be assigned
    function createHolding() external returns (address);

    /// @notice creates holding at assigns it to the user
    function createHoldingForMyself() external returns (address);

    /// @notice assigns a new user to an existing holding
    /// @dev callable by owner only
    /// @param _user new user's address
    function assignHolding(address _user) external;

    /// @notice user grabs an existing holding, with a deposit
    function assignHoldingToMyself() external;
}
