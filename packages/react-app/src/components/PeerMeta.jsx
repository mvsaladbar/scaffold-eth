import * as React from "react";
// import styled from "styled-components";
// import { IClientMeta } from "@walletconnect/types";



// interface IPeerMetaProps {
//   peerMeta: IClientMeta;
// }

export const PeerMeta = (props) => (
  <>
    <img src={props.peerMeta.icons[0]} alt={props.peerMeta.name} />
    <h2>{props.peerMeta.name}</h2>
    <h3>{props.peerMeta.description}</h3>
    <h3>{props.peerMeta.url}</h3>
  </>
);
