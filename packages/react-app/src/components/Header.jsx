import { PageHeader, Tag, Button } from "antd";
import React, {useContext} from "react";



// displays a page header

export default function Header({link, title, connected, address, targetNetwork, killSession}) {

  return (
      <PageHeader
        title={title}
        tags={connected ? <Tag color="blue">connected</Tag> : <Tag color="red">disconnected</Tag>}
        style={{ cursor: "pointer" }}
        extra={[
          <Button key="2" >{targetNetwork.name}</Button>,
          <Button key="1" onClick={killSession} type="primary">Kill Session</Button>
        ]}
      > 
      </PageHeader>
  );
}


// Header.defaultProps = {
//   link: "https://github.com/austintgriffith/scaffold-eth",
//   title: "🏗 scaffold-eth",
//   subTitle: "forkable Ethereum dev stack focused on fast product iteration",
// }