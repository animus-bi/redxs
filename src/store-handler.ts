import { Store } from "./store";

export class StoreHandler {
  constructor(
    public store: Store<any>,
    public callback: (...args: any) => any
  ) { }
}