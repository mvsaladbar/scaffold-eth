import { WalletController, getWalletController } from "./WalletController";
import { StoreController, getStoreController } from "./store";



let controllers = null ;

export function setupAppControllers() {
  const wallet = getWalletController();
  const store = getStoreController();
  controllers = { store, wallet };
  return controllers;
}

export function getAppControllers() {
  let _controllers = controllers;
  if (!_controllers) {
    _controllers = setupAppControllers();
  }
  return _controllers;
}
