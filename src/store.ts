import { config, Observable } from "rxjs";
import { StoreConfig } from "./store-config";
import { XSBus } from "./xs-bus";
import { XSRootContext } from "./xs-root-context";
import { ActionHandlersMap } from "./types";
import { CreateSelector, CreateSliceSelector, CreateStore } from "./creators";
import { map } from "rxjs/operators";

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

  get rootState$() {
    return XSRootContext.state$;
  }

  get state$() {
    return CreateSliceSelector(this.name, (state) => state);
  }

  select(predicate: (state: T) => any) {
    return CreateSliceSelector(this.name, (state) => state.pipe(map(predicate)))
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

  select$ = CreateSelector;

  static dispatch(action: any): Observable<void> {
    return XSBus.dispatch(action);
  }

  static Create = CreateStore;
  static CreateSelector = CreateSelector;
  static CreateSliceSelector = CreateSliceSelector;

}