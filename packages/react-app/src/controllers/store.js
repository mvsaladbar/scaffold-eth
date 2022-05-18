import { setLocal, getLocal, removeLocal } from "../helpers/local";

export class StoreController {
    async set(key, data){
    return setLocal(key, data);
    }
   async get(key) {
    return getLocal(key);
    }
  async remove(key){
    return removeLocal(key);
  }
}

export function getStoreController() {
  return new StoreController();
}
