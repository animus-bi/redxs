import { ActionHandlersMap } from './types/action-handlers-map';
import { xsStateContext } from './redxs-state-context';
import { StateContext } from './state-context';
import { StoreConfig } from './store-config';

export abstract class Store<T> {

  abstract get config(): StoreConfig<T>;

  context: StateContext<T> | undefined;

  get name() {
    return (this.config || this.constructor).name || this.constructor.name;
  }

  get initialState() {
    return { ...(this.config || { initialState: {} }).initialState };
  }

  get handlers(): ActionHandlersMap<T>  {
    return (this.config || { handlers: {} }).handlers as any;
  }

  createSelector(predicate: (state: T) => any) {
    return xsStateContext.createSliceSelector(this.name, predicate);
  }

}