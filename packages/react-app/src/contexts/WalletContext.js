import React, {createContext, useEffect, useReducer} from 'react';
import  {WCReducer} from '../reducers/WCReducer';

export const WalletContext=createContext();

const initState={
    wcConnected:false,
    currentState:null,
}

 export const WalletContextProvider=(props)=>{
  const [walletstate, dispatch] = useReducer(WCReducer, initState,()=>{
    const data=localStorage.getItem('state');
    return data?JSON.parse(data):initState
  });
  useEffect(()=>{
      localStorage.setItem('state',JSON.stringify(walletstate));
  },[walletstate])
    return(
        <WalletContext.Provider value={{walletstate,dispatch}}>
            {props.children}
        </WalletContext.Provider>
    )
}