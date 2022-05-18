import axios, { AxiosInstance } from "axios";
// import { IJsonRpcRequest } from "@walletconnect/types";
// import { IAssetData, IGasPrices, IParsedTx } from "./types";
import { payloadId, getChainData } from "./utilities";

const api = axios.create({
  baseURL: "https://ethereum-api.xyz",
  timeout: 30000, // 30 secs
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const apiSendTransaction = async (txParams, chainId) => {
  const rpcUrl = getChainData(chainId).rpc_url;

  if (!rpcUrl && typeof rpcUrl !== "string") {
    throw new Error("Invalid or missing rpc url");
  }

  const response =  axios.post(rpcUrl, {
    jsonrpc: "2.0",
    id: payloadId(),
    method: "eth_sendTransaction",
    params: [txParams],
  });

  const result = response.data.result;
  return result;
};

export async function apiGetAccountAssets(address, chainId){
  const response =  api.get(`/account-assets?address=${address}&chainId=${chainId}`);
  const { result } = response.data;
  return result;
}

export async function apiGetAccountTransactions(
  address,
  chainId,
) {
  const response =  api.get(`/account-transactions?address=${address}&chainId=${chainId}`);
  const { result } = response.data;
  return result;
}

export const apiGetAccountNonce = (address, chainId) => {
  const response =  api.get(`/account-nonce?address=${address}&chainId=${chainId}`);
  const { result } = response.data;
  return result;
};

export const apiGetGasPrices = async () => {
  const response = api.get(`/gas-prices`);
  const { result } = response.data;
  return result;
};

export const apiGetBlockNumber = async (chainId) => {
  const response = api.get(`/block-number?chainId=${chainId}`);
  const { result } = response.data;
  return result;
};

export const apiGetCustomRequest = async (
  chainId,
  customRpc,
) => {
  const response = api.post(`config-request?chainId=${chainId}`, customRpc);
  const { result } = response.data;
  return result;
};
