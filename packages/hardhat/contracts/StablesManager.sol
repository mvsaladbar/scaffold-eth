// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/RebaseLib.sol";
import "./libraries/OperationsLib.sol";

import "./interfaces/core/IManager.sol";
import "./interfaces/core/IHoldingManager.sol";
import "./interfaces/core/IStablesManager.sol";
import "./interfaces/stablecoin/IPandoraUSD.sol";
import "./interfaces/stablecoin/ISharesRegistry.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title StablesManager contract
/// @author Cosmin Grigore (@gcosmintech)
contract StablesManager is IStablesManager, Ownable {
    using RebaseLib for RebaseLib.Rebase;

    /// @notice AlcBox project stablecoin address
    IPandoraUSD public override pandoraUSD;

    /// @notice contract that contains the address of the manager contract
    IManagerContainer public immutable override managerContainer;

    /// @notice returns the pause state of the contract
    bool public override paused;

    /// @notice total borrow per token
    mapping(address => RebaseLib.Rebase) public override totalBorrowed;

    /// @notice returns config info for each share
    mapping(address => ShareRegistryInfo) public override shareRegistryInfo;

    // Rebase from amount to share
    mapping(IERC20 => RebaseLib.Rebase) public override totals;

    /// @notice creates a new StablesManager contract
    /// @param _managerContainer contract that contains the address of the manager contract
    /// @param _pandoraUSD the protocol's stablecoin address
    constructor(address _managerContainer, address _pandoraUSD) {
        require(_managerContainer != address(0), "3065");
        require(_pandoraUSD != address(0), "3001");
        managerContainer = IManagerContainer(_managerContainer);
        pandoraUSD = IPandoraUSD(_pandoraUSD);
    }

    // -- Owner specific methods --
    /// @notice sets a new value for pause state
    /// @param _val the new value
    function setPaused(bool _val) external override onlyOwner {
        emit PauseUpdated(paused, _val);
        paused = _val;
    }

    /// @notice sets the pUSD address
    /// @param _newAddr contract's address
    function setPandoraUSD(address _newAddr) external override onlyOwner {
        require(_newAddr != address(0), "3000");
        emit StableAddressUpdated(address(pandoraUSD), _newAddr);
        pandoraUSD = IPandoraUSD(_newAddr);
    }

    /// @notice registers a share registry contract for a token
    /// @param _registry registry contract address
    /// @param _token token address
    function registerShareRegistry(address _registry, address _token)
        external
        onlyOwner
    {
        require(_token != address(0), "3007");
        require(shareRegistryInfo[_token].deployedAt == address(0), "3017");

        _setShareRegistry(_registry, _token, true);
        emit RegistryAdded(_token, _registry);
    }

    /// @notice updates an already registered share registry contract for a token
    /// @param _registry registry contract address
    /// @param _token token address
    /// @param _active set it as active or inactive
    function updateShareRegistry(
        address _registry,
        address _token,
        bool _active
    ) external onlyOwner {
        require(_token != address(0), "3007");
        require(shareRegistryInfo[_token].deployedAt != address(0), "3060");

        _setShareRegistry(_registry, _token, _active);
        emit RegistryUpdated(_token, _registry);
    }

    // -- View type methods --

    /// @notice Returns amount to share transformation
    /// @param _token token for which the exchange is done
    /// @param _amount token's amount
    /// @param _roundUp if the resulted shares are rounded up
    /// @return _share obtained shares
    function toShare(
        IERC20 _token,
        uint256 _amount,
        bool _roundUp
    ) public view override returns (uint256 _share) {
        _share = totals[_token].toBase(_amount, _roundUp);
    }

    /// @dev Returns share to amount transformation
    /// @param _token token for which the exchange is done
    /// @param _share amount of shares
    /// @param _roundUp if the resulted amount is rounded up
    /// @return _amount obtained amount
    function toAmount(
        IERC20 _token,
        uint256 _share,
        bool _roundUp
    ) public view override returns (uint256 _amount) {
        _amount = totals[_token].toElastic(_share, _roundUp);
    }

    /// @notice Returns true if user is solvent for the specified token
    /// @param _token the token for which the check is done
    /// @param _holding the user address
    /// @return true/false
    function isSolvent(address _token, address _holding)
        public
        view
        override
        returns (bool)
    {
        require(_holding != address(0), "3031");
        ISharesRegistry registry = ISharesRegistry(
            shareRegistryInfo[_token].deployedAt
        );
        require(address(registry) != address(0), "3008");

        if (registry.borrowed(_holding) == 0) return true;

        uint256 _solvencyRatio = _getSolvencyRatio(_holding, registry);

        uint256 _borrowRatio = (registry.borrowed(_holding) *
            totalBorrowed[_token].elastic) / totalBorrowed[_token].base;

        return _solvencyRatio >= _borrowRatio;
    }

    /// @notice get liquidation info for holding and token
    /// @dev returns borrowed amount, collateral amount, collateral's value ratio, current borrow ratio, solvency status; colRatio needs to be >= borrowRaio
    /// @param _holding address of the holding to check for
    /// @param _token address of the token to check for
    function getLiquidationInfo(address _holding, address _token)
        external
        view
        override
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        ISharesRegistry registry = ISharesRegistry(
            shareRegistryInfo[_token].deployedAt
        );

        uint256 colRatio = _getSolvencyRatio(_holding, registry);
        uint256 borrowRatio = registry.borrowed(_holding) == 0
            ? 0
            : (registry.borrowed(_holding) * totalBorrowed[_token].elastic) /
                totalBorrowed[_token].base;

        return (
            registry.borrowed(_holding),
            registry.collateral(_holding),
            colRatio,
            borrowRatio,
            colRatio >= borrowRatio
        );
    }

    /// @notice returns collateral amount
    /// @param _token collateral token
    /// @param _amount stablecoin amount
    function computeNeededCollateral(address _token, uint256 _amount)
        external
        view
        override
        returns (uint256 result)
    {
        result =
            (_amount * _getManager().EXCHANGE_RATE_PRECISION()) /
            ISharesRegistry(shareRegistryInfo[_token].deployedAt)
                .exchangeRate();
    }

    // -- Write type methods --

    /// @notice accrues collateral for holding
    /// @dev callable by the owner
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function forceAddCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external override onlyOwner {
        uint256 _share = _addCollateral(_holding, _token, _amount);
        emit ForceAddedCollateral(_holding, _token, _share);
    }

    /// @notice registers new collateral
    /// @dev the amount will be transformed to shares
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount amount of tokens to be added as collateral
    function addCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external override notPaused onlyHoldingOrStrategyManager {
        require(shareRegistryInfo[_token].active, "1201");
        uint256 _share = _addCollateral(_holding, _token, _amount);

        emit AddedCollateral(_holding, _token, _share);
    }

    /// @notice removes collateral for holding
    /// @dev callable by the owner
    /// @param _holding the holding for which collateral is removed
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function forceRemoveCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external override onlyOwner {
        uint256 _share = _removeCollateral(_holding, _token, _amount);
        emit ForceRemovedCollateral(_holding, _token, _share);
    }

    /// @notice unregisters collateral
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function removeCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external override onlyHoldingOrStrategyManager notPaused {
        require(shareRegistryInfo[_token].active, "1201");
        uint256 _share = _removeCollateral(_holding, _token, _amount);

        require(isSolvent(_token, _holding), "3009");
        emit RemovedCollateral(_holding, _token, _share);
    }

    /// @notice migrates collateral and share to a new registry
    /// @param _holding the holding for which collateral is added
    /// @param _tokenFrom collateral token source
    /// @param _tokenTo collateral token destination
    /// @param _collateralFrom collateral amount to be removed from source
    /// @param _collateralTo collateral amount to be added to destination
    function migrateDataToRegistry(
        address _holding,
        address _tokenFrom,
        address _tokenTo,
        uint256 _collateralFrom,
        uint256 _collateralTo
    ) external override onlyHoldingOrStrategyManager notPaused {
        ISharesRegistry registryFrom = ISharesRegistry(
            shareRegistryInfo[_tokenFrom].deployedAt
        );

        uint256 _migratedRatio = OperationsLib.getRatio(
            _collateralFrom,
            registryFrom.collateral(_holding),
            18
        );

        if (shareRegistryInfo[_tokenTo].deployedAt != address(0)) {
            _addCollateral(_holding, _tokenTo, _collateralTo);
        }
        _removeCollateral(_holding, _tokenFrom, _collateralFrom);

        uint256 _borrowedFrom = 0;
        uint256 _borrowedSharesFrom = 0;
        if (
            registryFrom.borrowed(_holding) > 0 &&
            shareRegistryInfo[_tokenTo].deployedAt != address(0)
        ) {
            ISharesRegistry registryTo = ISharesRegistry(
                shareRegistryInfo[_tokenTo].deployedAt
            );

            uint256 _borrowedTo = 0;
            uint256 _borrowedSharesTo = 0;

            (
                _borrowedFrom,
                _borrowedSharesFrom,
                _borrowedTo,
                _borrowedSharesTo
            ) = _getMigrationData(
                _holding,
                registryFrom,
                _tokenTo,
                _migratedRatio
            );

            //add to destination
            _updateDestinationOnMigration(
                _holding,
                registryTo,
                _borrowedTo,
                _borrowedSharesTo
            );

            //remove from source
            _updateSourceOnMigration(
                _holding,
                registryFrom,
                _borrowedFrom,
                _borrowedSharesFrom
            );

            //do not check solvency to save gas
        }

        emit CollateralMigrated(
            _holding,
            _tokenFrom,
            _tokenTo,
            _borrowedFrom,
            _borrowedSharesFrom,
            _collateralTo
        );
    }

    /// @notice mints stablecoin to the user
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount the borrowed amount
    /// @param _mintDirectlyToUser if true mints to user instead of holding
    function borrow(
        address _holding,
        address _token,
        uint256 _amount,
        bool _mintDirectlyToUser
    )
        external
        override
        onlyHoldingOrStrategyManager
        notPaused
        returns (
            uint256 part,
            uint256 share,
            uint256 feeAmount
        )
    {
        require(_amount > 0, "3010");
        require(shareRegistryInfo[_token].active, "1201");

        ISharesRegistry registry = ISharesRegistry(
            shareRegistryInfo[_token].deployedAt
        );

        totalBorrowed[_token].elastic = registry.accrue(
            totalBorrowed[_token].base,
            totalBorrowed[_token].elastic
        );

        feeAmount =
            (_amount * registry.borrowOpeningFee()) /
            _getManager().BORROW_FEE_PRECISION();
        _amount -= feeAmount;

        (totalBorrowed[_token], part) = totalBorrowed[_token].add(
            _amount,
            true
        );

        registry.setBorrowed(_holding, registry.borrowed(_holding) + part);

        share = toShare(IERC20(address(pandoraUSD)), part, false);
        registry.setBorrowedShares(
            _holding,
            registry.borrowedShares(_holding) + share
        );

        registry.updateExchangeRate();
        require(isSolvent(_token, _holding), "3009");

        if (!_mintDirectlyToUser) {
            pandoraUSD.mint(
                _holding,
                _amount,
                IERC20Metadata(_token).decimals()
            );
        } else {
            pandoraUSD.mint(
                _getHoldingManager().holdingUser(_holding),
                _amount,
                IERC20Metadata(_token).decimals()
            );
        }

        if (feeAmount > 0) {
            address feeAddr = IManager(managerContainer.manager()).feeAddress();
            require(feeAddr != address(0), "3060");
            pandoraUSD.mint(feeAddr, feeAmount, 18);
        }

        emit Borrowed(_holding, _amount, part, _mintDirectlyToUser);
    }

    /// @notice registers a repay operation
    /// @param _holding the holding for which repay is performed
    /// @param _token collateral token
    /// @param _part the repayed amount
    /// @param _repayFromUser if true it will burn from user's wallet, otherwise from user's holding
    /// @param _selfLiquidation if true, nothing is burned
    function repay(
        address _holding,
        address _token,
        uint256 _part,
        bool _repayFromUser,
        bool _selfLiquidation
    )
        external
        override
        onlyHoldingOrStrategyManager
        notPaused
        returns (uint256 amount)
    {
        require(shareRegistryInfo[_token].active, "1201");

        ISharesRegistry registry = ISharesRegistry(
            shareRegistryInfo[_token].deployedAt
        );
        require(registry.borrowed(_holding) > 0, "3011");
        require(_part > 0, "3012");

        totalBorrowed[_token].elastic = registry.accrue(
            totalBorrowed[_token].base,
            totalBorrowed[_token].elastic
        );

        (totalBorrowed[_token], amount) = totalBorrowed[_token].sub(
            _part,
            true
        );
        registry.setBorrowed(_holding, registry.borrowed(_holding) - _part);

        uint256 share = toShare(IERC20(address(pandoraUSD)), amount, true);
        registry.setBorrowedShares(
            _holding,
            registry.borrowedShares(_holding) - share
        );

        if (!_selfLiquidation) {
            if (!_repayFromUser) {
                pandoraUSD.burnFrom(
                    _holding,
                    _part,
                    IERC20Metadata(_token).decimals()
                );
            } else {
                pandoraUSD.burnFrom(
                    _getHoldingManager().holdingUser(_holding),
                    _part,
                    IERC20Metadata(_token).decimals()
                );
            }
        }

        emit Repayed(_holding, amount, _part, _repayFromUser, _selfLiquidation);
    }

    struct LiqTempData {
        RebaseLib.Rebase _totalBorrow;
        RebaseLib.Rebase _totals;
        uint256 _exchangeRate;
        uint256 borrowPart;
        uint256 borrowAmount;
        uint256 liquidationCollateralShare;
        uint256 protocolShare;
    }

    /// @notice registers a liquidation event
    /// @dev if user is solvent, there's no need for liqudation;
    /// @param _liquidatedHolding address of the holding which is being liquidated
    /// @param _token collateral token
    /// @param _holdingTo address of the holding which initiated the liquidation
    /// @param _burnFromUser if true, burns stablecoin from the liquidating user, not from the holding
    /// @return result true if liquidation happened
    /// @return collateralAmount the amount of collateral to move
    /// @return protocolFeeAmount the protocol fee amount
    function liquidate(
        address _liquidatedHolding,
        address _token,
        address _holdingTo,
        bool _burnFromUser
    )
        external
        override
        onlyHoldingOrStrategyManager
        notPaused
        returns (
            bool,
            uint256,
            uint256
        )
    {
        require(_liquidatedHolding != _holdingTo, "3013");
        ISharesRegistry registry = ISharesRegistry(
            shareRegistryInfo[_token].deployedAt
        );
        LiqTempData memory tempData;

        //steps:
        //1-update exchange rate and accrue
        //2-check borrowed amount
        //3-check collateral share
        //4-update user's collateral share
        //5-declare user solvent

        //the oracle call can fail but we still need to allow liquidations
        (, tempData._exchangeRate) = registry.updateExchangeRate();
        accrue(_token);

        tempData._totalBorrow = totalBorrowed[_token];
        tempData._totals = totals[IERC20(_token)];

        //nothing to do if user is already solvent; skip liquidation
        if (isSolvent(_token, _liquidatedHolding)) return (false, 0, 0);

        tempData.borrowPart = registry.borrowed(_liquidatedHolding);
        tempData.borrowAmount = tempData._totalBorrow.toElastic(
            tempData.borrowPart,
            false
        );

        tempData.protocolShare = tempData._totals.toBase(
            (tempData.borrowAmount *
                registry.liquidationMultiplier() *
                tempData._exchangeRate) /
                (_getManager().LIQUIDATION_MULTIPLIER_PRECISION() *
                    _getManager().EXCHANGE_RATE_PRECISION()),
            false
        );

        tempData.liquidationCollateralShare =
            registry.collateral(_liquidatedHolding) -
            tempData.protocolShare;

        //we move everything here as this gets fixed in HoldingManager after taking the `_maxLoss` parameter into account
        registry.updateLiquidatedCollateral(
            _liquidatedHolding,
            _holdingTo,
            tempData.liquidationCollateralShare + tempData.protocolShare
        );

        tempData._totalBorrow.elastic =
            tempData._totalBorrow.elastic -
            uint128(tempData.borrowAmount);
        tempData._totalBorrow.base =
            tempData._totalBorrow.base -
            uint128(tempData.borrowPart);
        totalBorrowed[_token] = tempData._totalBorrow;

        registry.setBorrowed(_liquidatedHolding, 0);
        registry.setBorrowedShares(_liquidatedHolding, 0);

        pandoraUSD.burnFrom(
            _burnFromUser
                ? IHoldingManager(_getManager().holdingManager()).holdingUser(
                    _holdingTo
                )
                : _holdingTo,
            tempData.borrowAmount,
            IERC20Metadata(_token).decimals()
        );

        emit Liquidated(
            _liquidatedHolding,
            _holdingTo,
            _token,
            tempData.liquidationCollateralShare,
            tempData.protocolShare,
            tempData.borrowAmount
        );

        return (
            true,
            totals[IERC20(_token)].toElastic(
                tempData.liquidationCollateralShare,
                false
            ),
            totals[IERC20(_token)].toElastic(tempData.protocolShare, false)
        );
    }

    /// @notice accures interest for token
    /// @param _token token's address
    function accrue(address _token) public notPaused {
        require(shareRegistryInfo[_token].active, "1201");
        totalBorrowed[_token].elastic = ISharesRegistry(
            shareRegistryInfo[_token].deployedAt
        ).accrue(totalBorrowed[_token].base, totalBorrowed[_token].elastic);
    }

    // -- Private methods --
    /// @notice sets registry and registry info
    function _setShareRegistry(
        address _registry,
        address _token,
        bool _active
    ) private {
        ShareRegistryInfo memory info;
        info.deployedAt = _registry;
        info.active = _active;
        shareRegistryInfo[_token] = info;
    }

    /// @notice used to update destination borrowed values when migrating collateral
    function _updateDestinationOnMigration(
        address _holding,
        ISharesRegistry registryTo,
        uint256 _borrowedTo,
        uint256 _borrowedSharesTo
    ) private {
        registryTo.setBorrowed(
            _holding,
            _borrowedTo + registryTo.borrowed(_holding)
        );
        registryTo.setBorrowedShares(
            _holding,
            _borrowedSharesTo + registryTo.borrowedShares(_holding)
        );

        (totalBorrowed[registryTo.token()], ) = totalBorrowed[
            registryTo.token()
        ].add(_borrowedTo, true);
    }

    /// @notice used to update source borrowed values when migrating collateral
    function _updateSourceOnMigration(
        address _holding,
        ISharesRegistry registryFrom,
        uint256 _borrowedFrom,
        uint256 _borrowedSharesFrom
    ) private {
        registryFrom.setBorrowed(
            _holding,
            registryFrom.borrowed(_holding) - _borrowedFrom
        );
        registryFrom.setBorrowedShares(
            _holding,
            registryFrom.borrowedShares(_holding) - _borrowedSharesFrom
        );
        (totalBorrowed[registryFrom.token()], ) = totalBorrowed[
            registryFrom.token()
        ].sub(_borrowedFrom, true);
    }

    /// @notice used to get migration values for borrowed amounts
    function _getMigrationData(
        address _holding,
        ISharesRegistry _from,
        address _to,
        uint256 _ratio
    )
        private
        view
        returns (
            uint256 _borrowedFrom,
            uint256 _borrowedSharesFrom,
            uint256 _borrowedTo,
            uint256 _borrowedSharesTo
        )
    {
        uint256 _tokenFromDecimals = IERC20Metadata(_from.token()).decimals();
        uint256 _tokenToDecimals = IERC20Metadata(_to).decimals();

        _borrowedFrom = (_from.borrowed(_holding) * _ratio) / 1e18;
        _borrowedSharesFrom = (_from.borrowedShares(_holding) * _ratio) / 1e18;

        if (_tokenFromDecimals > _tokenToDecimals) {
            _borrowedTo =
                _borrowedFrom /
                10**(_tokenFromDecimals - _tokenToDecimals);

            _borrowedSharesTo =
                _borrowedSharesFrom /
                10**(_tokenFromDecimals - _tokenToDecimals);
        } else {
            _borrowedTo =
                _borrowedFrom *
                10**(_tokenToDecimals - _tokenFromDecimals);

            _borrowedSharesTo =
                _borrowedSharesFrom *
                10**(_tokenToDecimals - _tokenFromDecimals);
        }
    }

    /// @notice used to remove collateral from holding
    function _removeCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) private returns (uint256 _share) {
        require(_amount > 0, "2004");

        //if share > collateral[user] we consider share = collateral[user]
        _share = totals[IERC20(_token)].toBase(_amount, false);

        ISharesRegistry(shareRegistryInfo[_token].deployedAt)
            .unregisterCollateral(
                _holding,
                _share,
                totalBorrowed[_token].base,
                totalBorrowed[_token].elastic
            );

        RebaseLib.Rebase memory total = totals[IERC20(_token)];

        uint256 amount = total.toElastic(_share, false);
        total.base = uint128(_share) > total.base
            ? 0
            : total.base - uint128(_share);
        total.elastic = uint128(amount) > total.elastic
            ? 0
            : total.elastic - uint128(amount);
        totals[IERC20(_token)] = total;
    }

    /// @notice used to accrue collateral
    function _addCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) private returns (uint256 _share) {
        require(_amount > 0, "2001");

        _share = totals[IERC20(_token)].toBase(_amount, false);

        ISharesRegistry(shareRegistryInfo[_token].deployedAt)
            .registerCollateral(_holding, _share);

        RebaseLib.Rebase memory total = totals[IERC20(_token)];

        total.base = total.base + uint128(_share);
        require(total.base >= _getManager().MINIMUM_SHARE_BALANCE(), "3028");

        total.elastic = total.elastic + uint128(_amount);
        totals[IERC20(_token)] = total;
    }

    function _getSolvencyRatio(address _holding, ISharesRegistry registry)
        private
        view
        returns (uint256)
    {
        uint256 _colRate = registry.collateralizationRate();
        uint256 _exchangeRate = registry.exchangeRate();

        uint256 _share = ((1e18 *
            registry.collateral(_holding) *
            _exchangeRate *
            _colRate) /
            (_getManager().EXCHANGE_RATE_PRECISION() *
                _getManager().COLLATERALIZATION_PRECISION())) / 1e18;

        return toAmount(IERC20(registry.token()), _share, false);
    }

    function _getManager() private view returns (IManager) {
        return IManager(managerContainer.manager());
    }

    function _getHoldingManager() private view returns (IHoldingManager) {
        return IHoldingManager(_getManager().holdingManager());
    }

    // -- modifiers --
    modifier onlyHoldingOrStrategyManager() {
        require(
            msg.sender == _getManager().holdingManager() ||
                msg.sender == _getManager().strategyManager(),
            "1000"
        );
        _;
    }

    modifier notPaused() {
        require(!paused, "1200");
        _;
    }
}
