
import { Observable } from 'rxjs';
import { XSBus } from "./xs-bus";
import { XSRootContext } from "./xs-root-context";
import { Store } from "./store";
import { StoreConfig } from "./store-config";


export function CreateStore<T>(config: StoreConfig<T>): Store<T> {
  const store = new Store<T>(config);

  XSBus.registerStore(store);
  XSRootContext.registerStore(store);

  return store;
}

export function CreateSelector(predicate: (rootState: any) => any): Observable<any> {
  return XSRootContext.createRootSelector(predicate);
}

export function CreateSliceSelector(sliceName: string, predicate: (sliceState: any) => any) {
  return XSRootContext.createSliceSelector(sliceName, predicate);
}