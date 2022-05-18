// import { IRpcEngine } from "../helpers/types";
// import { IAppState } from "../App";
import ethereum from "./ethereum";

class RpcEngine {
  engines = [];
  constructor(engines) {
    this.engines = engines;
  }

    filter(payload) {
    const engine = this.getEngine(payload);
    return engine.filter(payload);
  }

    router(payload, state, setState) {
    const engine = this.getEngine(payload);
    return engine.router(payload, state, setState);
  }

   render(payload) {
    const engine = this.getEngine(payload);
    return engine.render(payload);
  }

   signer(payload, state, setState) {
    const engine = this.getEngine(payload);
    return engine.signer(payload, state, setState);
  }

   getEngine(payload) {
    const match = this.engines.filter(engine => engine.filter(payload));
    if (!match || !match.length) {
      throw new Error(`No RPC Engine found to handle payload with method ${payload.method}`);
    }
    return match[0];
  }
}

export function getRpcEngine() {
  return new RpcEngine([ethereum]);
}
