import * as React from "react";
import{ Card, Popconfirm } from "antd";
import { Button } from "antd";


export default function RequestDisplay(props){
  // const params = props.renderPayload(props.payload);
  console.log('RequestDisplay re-rending')
    return (
      <Card>
        <h6>{"Request From"}</h6>
        {/* <div>
          <img src={props.peerMeta.icons[0]} alt={props.peerMeta.name} />
          <div>{props.peerMeta.name}</div>
        </div> */}
        {/* {params.map(param => (
          <React.Fragment key={param.label}>
            <h6>{param.label}</h6>
            <requestvalues>{param.value}</requestvalues>
          </React.Fragment>
        ))} */}
        <Popconfirm>
          <Button onClick={props.approveRequest}>{`Approve`}</Button>
          <Button onClick={props.rejectRequest}>{`Reject`}</Button>
        </Popconfirm>
      </Card>
    );
}

