import { Observable } from "rxjs";
import { StoreConfig } from "./store-config";
import { XSBus } from "./xs-bus";
import { XSRootContext } from "./xs-root-context";
import { ActionHandlersMap } from "./types";
import { CreateSelector, CreateSliceSelector, CreateStore } from "./creators";
import { filter, map } from "rxjs/operators";

export class Store<T> {
  
  get name() {
    return (this.config || this.constructor).name || this.constructor.name;
  }

  get initialState() {
    return { ...(this.config || { initialState: {} }).initialState || {} };
  }

  get handlers(): ActionHandlersMap<T>  {
    return { ...(this.config || { handlers: {} }).handlers || {} };
  }

  effectState$ = (initialState: any) => 
    this.state$.pipe(filter((state) => JSON.stringify(initialState) !== JSON.stringify(state)));

  get rootState$() {
    return XSRootContext.state$;
  }

  get state$() {
    return XSRootContext.state$.pipe(map(root => root[this.name]));
  }

  currentState() {
    return XSRootContext.getStateContext(this.name).getState();
  }

  currentRootState() {
    return XSRootContext.getState();
  }
  
  constructor(private config: StoreConfig<T>) { }

  dispatch(action: any): Observable<void> {
    return Store.dispatch(action);
  }

  static dispatch(action: any): Observable<void> {
    return XSBus.dispatch(action);
  }

  static Create = CreateStore;
  static CreateSelector = CreateSelector;
  static CreateSliceSelector = CreateSliceSelector;

}