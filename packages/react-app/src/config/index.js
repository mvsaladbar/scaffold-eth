import walletconnectLogo from "./assets/walletconnect-logo.png";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, ETH_STANDARD_PATH } from "../constants";
import { getRpcEngine } from "../engines";

const appConfig = {
  name: "WalletConnect",
  logo: walletconnectLogo,
  chainId: DEFAULT_CHAIN_ID,
  derivationPath: ETH_STANDARD_PATH,
  numberOfAccounts: 3,
  colors: {
    defaultColor: "12, 12, 13",
    backgroundColor: "40, 44, 52",
  },
  chains: SUPPORTED_CHAINS,
  styleOpts: {
    showPasteUri: true,
    showVersion: true,
  },
  rpcEngine: getRpcEngine(),
  events: {
    init: (state, setState) => Promise.resolve(),
    update: (state, setState) => Promise.resolve(),
  },
};

export function getAppConfig() {
  return appConfig;
}
