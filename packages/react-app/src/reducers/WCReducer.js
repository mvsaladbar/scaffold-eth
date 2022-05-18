export const WCReducer=(walletstate,action)=>{
    let wallet=[];
    switch(action.type){
        case "CONNECT": console.log('connect')
            wallet.push({
                connector:action.payload.connector,                                                        
                walletController:action.payload.walletController});
            localStorage.setItem('state',JSON.stringify(wallet));
           return {
               ...walletstate,
            wcConnected:true,
            currentState:{
                connector:action.payload.connector,
                walletController:action.payload.walletController
            },
            msg:'Connected successfully!'
            };

        case "DISCONNECT": console.log('disconnect');
            return {...walletstate,
                wcConnected:false,
                currentState:null
                };
        default:        return walletstate;
    }
}