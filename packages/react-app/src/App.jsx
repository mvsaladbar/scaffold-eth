// import {SyncOutlined } from "@ant-design/icons";
// import { utils } from "ethers";
import {Popconfirm, Card, DatePicker, Divider, Input, Button, Image, Col, Row} from "antd";
import React, { useEffect, useState, useContext } from "react";
// import { Address, Balance, Events } from "../components";
import { getCachedSession } from "./helpers/utilities";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { getWalletController } from "./controllers/WalletController";
import walletconnectLogo from "./walletconnect-logo.png"
import { NETWORKS, ETH_STANDARD_PATH, DEFAULT_CHAIN_ID, DEFAULT_ACTIVE_INDEX, ALCHEMY_KEY } from "./constants";
import Account from "./components/Account"
import RequestDisplay from "./components/RequestDisplay";
import RequestButton from "./components/RequestButton";
import WalletConnect from "@walletconnect/client";
import { getRpcEngine } from "./engines";
import { WalletContext } from './contexts/WalletContext';
import { getAppConfig } from "./config";
import { getAppControllers } from "./controllers";
import { Header, Faucet, GasGauge, Ramp } from "./components";
import { PeerMeta } from "./components/PeerMeta";
import { Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";





// Log the initial state
// {todos: [....], filters: {status, colors}}

// Every time the state changes, log it
// Note that subscribe() returns a function for unregistering the listener

// Now, dispatch some actions


export const DEFAULT_ACCOUNTS = getAppControllers().wallet.getAccounts();
export const DEFAULT_ADDRESS = DEFAULT_ACCOUNTS[DEFAULT_ACTIVE_INDEX];


export const INITIAL_STATE = {
  uri: '',
  connector: null,
  loading: false,
  scanner: false,
  uri: "",
  peerMeta: {
    description: "",
    url: "",
    icons: [],
    name: "",
    ssl: false,
  },
  connected: false,
  chainId: getAppConfig().chainId || DEFAULT_CHAIN_ID,
  accounts: DEFAULT_ACCOUNTS,
  address: DEFAULT_ADDRESS,
  activeIndex: DEFAULT_ACTIVE_INDEX,
  requests: [],
  results: [],
  payload: null,
};

const initialNetwork = NETWORKS.ropsten;
const NETWORKCHECK = true;
const USE_NETWORK_SELECTOR = false;



const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];





export default function App() {

  

  // const [state, setState] = useState({
  //   uri: '',
  //   connector: null,
  //   activeIndex: 0,
  //   chainId: 3,
  //   loading: false,
  //   peerMeta: null,
  //   connected: false,
  //   address: '',
  //   accounts: {},
  //   payload: {},
  //   requests:[],
  //   walletController: null,
  //   appConfig: {
  //     name: "WalletConnect",
  //     logo: walletconnectLogo,
  //     chainId: 3,
  //     derivationPath: ETH_STANDARD_PATH,
  //     numberOfAccounts: 3,
  //     colors: {
  //       defaultColor: "12, 12, 13",
  //       backgroundColor: "40, 44, 52",
  //     },
  //     chains: NETWORKS,
  //     styleOpts: {
  //       showPasteUri: true,
  //       showVersion: true,
  //     },
  //     rpcEngine: getRpcEngine(),
  //     events: {
  //       init: (state, setState) => Promise.resolve(),
  //       update: (state, setState) => Promise.resolve(),
  //     },
  //   }
  // });
  const networkOptions = [initialNetwork.name, "mainnet", "rinkeby"];
  const [state, setState] = useState(INITIAL_STATE);
  const [isInitialRender, setIsInitialRender] =useState(true);
  const [newWalletCreated, setNewWalletCreated] =useState(false);
  const [visible, setVisible] = useState(false);
  const [initOldSession, setInitOldSession] = useState(false);
  const [injectedProvider, setInjectedProvider] = useState(null);
  const [initializedWC, setInitializedWC] = useState(false);
  const [address, setAddress] = useState('');
  const [connectorEvent, setConnectorEvent] = useState(false);
  const [appConfig, setAppConfig] = useState(getAppConfig());


  // readContracts
  // writeContracts
  // price
  const [loading, setLoading] = useState(false);
  // function useEffectIf(condition, fn) {
  //   useEffect(() => condition && fn(), [condition])
  // }

  const bindedSetState = (newState) => setState(newState);
  const {walletstate,dispatch}=useContext(WalletContext)

  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);

  const targetNetwork = NETWORKS[selectedNetwork];

  const localProvider = getAppControllers().wallet.provider();

  const yourLocalBalance = useBalance(localProvider, address);

  const mainnetProvider = useStaticJsonRPC(providers);
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);
  const gasPrice = useGasPrice(targetNetwork, "fast");
  
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;


  async function subscribeToEvents() {
    console.log("ACTION", "subscribeToEvents");
    console.log("Connector is ", state.connector);
    if (state.connector) {
      state.connector.on("session_request", (error, payload) => {
        console.log("EVENT", "session_request");

        if (error) {
          throw error;
        }
        console.log("SESSION_REQUEST", payload.params);
        const { peerMeta } = payload.params[0];
        setState({...state, peerMeta: peerMeta});
      });

      state.connector.on("session_update", error => {
        console.log("EVENT", "session_update");

        if (error) {
          throw error;
        }
      });

      state.connector.on("call_request", async (error, payload) => {
        // tslint:disable-next-line
        console.log("EVENT", "call_request", "method", payload.method);
        console.log("EVENT", "call_request", "params", payload.params);

        if (error) {
          throw error;
        }
        await getAppConfig().rpcEngine.router(payload, state, bindedSetState);
      });

      state.connector.on("connect", (error, payload) => {
        console.log("EVENT", "connect");

        if (error) {
          throw error;
        }
        setState({...state, connected: state.connector.connected});
      });

      state.connector.on("disconnect", (error, payload) => {
        console.log("EVENT", "disconnect");

        if (error) {
          throw error;
        }

        resetApp();
      });

      console.log(state.connector.connected);

      if (state.connector.connected) {
        const { chainId, accounts } = state.connector;
        const index = 0;
        const address = accounts[index];
        getAppControllers().wallet.update(index, chainId);
        //figure this out
        await setState({...state, 
          connected: state.connector.connected,
           address: address,
           chainId: chainId});
      }
      // setState({...state, connector: state.connector});
    }
  };

  async function init (){

    const session = getCachedSession();

    if (!session) {
      console.log('HI MEMELISSA');
      // console.log(state.appConfig.derivationPath);
      await getAppControllers().wallet.init(state.activeIndex, state.chainId);
    } else {
      let connector = new WalletConnect({ session });

      let { connected, accounts, peerMeta } = connector;

      let address = accounts[0];

      let activeIndex = accounts.indexOf(address);
      let chainId = connector.chainId;

      await getAppControllers().wallet.init(activeIndex, chainId);

      await setState({...state, 
        activeIndex: activeIndex,
        chainId: connector.chainId,
        connected: connected,
        connector: connector,
        address: address,
        accounts: accounts,
        peerMeta: peerMeta
      });
      // await setInitOldSession(true);
      
      //subscribeToEvents(state);
    }
    await setInitializedWC(true);
  };

  function appConfigStuff() {
    getAppConfig().events.init(state, bindedSetState);
    getAppConfig().events.update(state, bindedSetState);
  }


  useEffect(() => {
    if (isInitialRender) {
      window.localStorage.removeItem('walletconnect');
      setIsInitialRender(false);
      init(() => appConfigStuff());
      subscribeToEvents();
    } 
    if (initOldSession) {
      setInitOldSession(false);
      subscribeToEvents();
    }
    if (newWalletCreated) {
      setNewWalletCreated(false);
      subscribeToEvents();
    }
    //check if we are already subscribed
    // if(initializedWC) {
    //   state.walletController.update(state);
    //   state.appConfig.events.update(state, bindedSetState);
    // }
    console.log(state);
  },[state]);




  async function createWallet () {
    if (newWalletCreated) {
      return;
    }
    setState({...state, loading: true});
    try {
    let uriLink = state.uri;
    const connector = new WalletConnect({ 
      bridge: "https://bridge.walletconnect.org",
      uri: uriLink, 
      clientMeta: {
        description: "WalletConnect Developer App",
        url: "https://walletconnect.org",
        icons: ["https://walletconnect.org/walletconnect-logo.png"],
        name: "WalletConnect",
      },
      
    }); 

    console.log(connector.connected);
    if(!connector.connected) {
      await connector.createSession();
      console.log("The connector is connected:" + connector.connected);

    }
    await setNewWalletCreated(true);
    await setState({...state,
      connector: connector,
      uri: connector.uri,
      connected: connector.connected,
    });
    // subscribeToEvents(state);
    dispatch({
      type:"CONNECT",
      payload:{
          connector:connector,
          walletController: getAppControllers().wallet,
      }
    })
    console.log(walletstate.wcConnected);
    } catch (error) {
      setState({...state, loading: false});
      throw(error);
    }
  }

  
  async function updateSession(sessionParams) {
    const newChainId = sessionParams.chainId || state.chainId;
    const newActiveIndex = sessionParams.activeIndex || state.activeIndex;
    const address = state.accounts[newActiveIndex];
    if (state.connector) {
      state.connector.updateSession({
        chainId: newChainId,
        accounts: [address],
      });
    }
    await setState({...state,
      connector: state.connector,
      address: address,
      accounts:state.accounts,
      activeIndex:state.activeIndex,
      chainId:state.chainId
    });
    await getAppControllers().wallet.update(newActiveIndex, newChainId);

  
  };

  async function updateChain(chainId) {
    await updateSession({ chainId });
  };

  async function updateAddress (activeIndex) {
    await updateSession({ activeIndex });
  };

  

  async function onURIPaste(){
    const uri = state.uri
    if (uri) {
      await createWallet();
    }
  };


  function approveSession(){

    setConnectorEvent(true);
    let chain_id = state.chainId;
    let addy = state.address;
    console.log("ACTION", "approveSession");
    if (state.connector) {
      state.connector.approveSession({ chain_id, accounts: [addy] });
    }
    setState({...state, connector: state.connector});
  };

  function rejectSession(){

    console.log('Clicked cancel button');
    setConnectorEvent(true);

    console.log("ACTION", "rejectSession");
    if (state.connector) {
      state.connector.rejectSession();
    }
    setState({...state, connector: state.connector});
  };

  function killSession(){
     
    console.log("ACTION", "killSession");
    setConnectorEvent(true);

    if (state.connector) {
      state.connector.killSession();
    }
    resetApp();
  };

   async function resetApp(){
    await setState({...INITIAL_STATE});
    setIsInitialRender(true);
    dispatch({
      type:'DISCONNECT'
  })
  };

  //onQRCodeClose = () => this.toggleScanner();

  async function openRequest(request) {

    const payload = Object.assign({}, request);

    const params = payload.params[0];
    if (request.method === "eth_sendTransaction") {
      //fix this
      payload.params[0] = await getAppControllers().wallet.populateTransaction(params);
    }
    setState({...state, payload: payload});
  };

  async function closeRequest() {
    const reqs = state.requests;
    const filteredRequests = reqs.filter(request => request.id !== state.payload.id);
    setState({...state, requests: filteredRequests});
    setState({...state, payload: null});
  };

  async function approveRequest() {
    try {
      //fix this
      await getAppConfig().rpcEngine.signer(state.payload, state, bindedSetState);
    } catch (error) {
      console.error(error);
      if (state.connector) {
        state.connector.rejectRequest({
          id: state.payload.id,
          error: { message: "Failed or Rejected Request" },
        });
      }
    }

    closeRequest();
    await setState({...state, connector: state.connector});
  };

  async function rejectRequest () {
    if (state.connector) {
      state.connector.rejectRequest({
        id: state.payload.id,
        error: { message: "Failed or Rejected Request" },
      });
    }
    await closeRequest();
    await setState({...state, connector: state.connector});
  };




  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <Header
      title="Pandora" 
      connected={state.connected}
      targetNetwork={targetNetwork}
      killSession={killSession}/>


      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <img width={300} src={getAppConfig().logo} alt={getAppConfig().name} />
        <Divider />
        <Card>
          {!state.connected ? (
            state.peerMeta && state.peerMeta.name ? (
              <Card>
                <PeerMeta peerMeta={state.peerMeta} />
                <Button onClick={approveSession}>{`Approve`}</Button>
                <Button onClick={rejectSession}>{`Reject`}</Button>
              </Card>
              ) : (
            <Card>
               <Account
              useBurner={false}
              address={state.address}
              userProvider={getAppControllers().wallet.provider()}
              updateAddress={updateAddress}
              updateChain={updateChain}
              isContract={false}
             />
  
              <h3>Insert a URI Link Below</h3>
              <Input
              onChange={e => {
              setState({...state, uri: e.target.value});
              }}
              />
              {/* <Popconfirm
              title="Are you sure to delete this task?"
              visible={visible}
              onConfirm={approveSession}
              onCancel={rejectSession}
              okButtonProps={{ loading: confirmLoading }}
              okText="Approve"
              cancelText="Reject" > */}
              <Button
                type="primary"
                style={{ marginTop: 8 }}
                onClick={onURIPaste}
              >Enter!</Button>
              {/* </Popconfirm> */}
              </Card>
          )
        ) : !state.payload ? (
          <Card>
             <Account
              useBurner={false}
              address={state.address}
              userProvider={getAppControllers().wallet.provider()}
              updateAddress={updateAddress}
              updateChain={updateChain}
              isContract={false}
             />
              {state.peerMeta && state.peerMeta.name && (
              <>
                <h6>{"Connected to"}</h6>
                <div>
                  <img src={state.peerMeta.icons[0]} alt={state.peerMeta.name} />
                  <div>{state.peerMeta.name}</div>
                </div>
              </>
              )}
              <h6>{"Pending Call Requests"}</h6>
              {state.requests.length ? (
                state.requests.map(request => (
                  <RequestButton key={request.id} onClick={() => openRequest(request)}>
                    <div>{request.method}</div>
                  </RequestButton>
              ))
                ) : (
                  <div>
                    <div>{"No pending requests"}</div>
                  </div>
                )}
          </Card>
            ) : (
              <div>
               <RequestDisplay
                  payload={state.payload}
                  peerMeta={state.peerMeta}
                  renderPayload={(payload) => getAppConfig().rpcEngine.render(payload)}
                  approveRequest={approveRequest}
                  rejectRequest={rejectRequest}
                />
                </div>
            )}
        </Card>
        <Divider />
      </div>
      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

