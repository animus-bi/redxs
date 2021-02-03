import { Observable } from "rxjs";
import { StoreConfig } from "./store-config";
import { XSBus } from "./xs-bus";
import { XSRootContext } from "./xs-root-context";
import { ActionHandlersMap } from "./types";
import { CreateSelector, CreateSliceSelector, CreateStore } from "./creators";
import { map } from "rxjs/operators";


export class Store<T> {

  private _selectors: { [key: string ]: Observable<T>} = { };

  private _setSelector<T, K extends keyof T>(obj: T, key: K|any, value: Observable<any>): void {
    obj[key] = value;
  }
  
  get name() {
    return (this.config || this.constructor).name || this.constructor.name;
  }

  get initialState() {
    return { ...(this.config || { initialState: {} }).initialState || {} };
  }

  get handlers(): ActionHandlersMap<T>  {
    return { ...(this.config || { handlers: {} }).handlers || {} };
  }

  get selectors() {
    return this._selectors;
  }

  get rootState$() {
    return XSRootContext.state$;
  }

  get dependentStores() {
    return this.config.dependentStores;
  }

  get state$() {
    return CreateSliceSelector(this.name, (state) => state);
  }

  constructor(private config: StoreConfig<T>) {
    const configSelectors = { ...(this.config || { selectors: {} }).selectors || {} };
    Object.keys(configSelectors).forEach((key) => {
      this._setSelector(this._selectors, key, CreateSliceSelector(this.name, configSelectors[key]))
    });
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

  dispatch(action: any): Observable<void> {
    return XSBus.dispatch(action);
  }

  ofActionDispatched(actionType: any) {
    return XSBus.onActionStatus(actionType, 'dispatch');
  }

  ofActionSuccessful(actionType: any) {
    return XSBus.onActionStatus(actionType, 'success');
  }

  ofActionErrored(actionType: any) {
    return XSBus.onActionStatus(actionType, 'error');
  }

  ofActionCompleted(actionType: any) {
    return XSBus.onActionStatus(actionType, 'complete');
  }

  select$(predicate: (state: T) => T): Observable<T> {
    return CreateSliceSelector(this.name, predicate);
  }

  static Create = CreateStore;
  static CreateSelector = CreateSelector;
  static CreateSliceSelector = CreateSliceSelector;

}