import { ActionHandlersMap } from './types/action-handlers-map';


export class StoreConfig<T> {
  name: string | undefined;
  initialState: T | undefined;
  handlers: ActionHandlersMap<T> | undefined;
  selectors?: { [key: string]: (state: T) => any } | undefined;
  dependentStores?: any[] = [];

  static create<Tt>(
    name: string,
    initialState: Tt,
    handlers: ActionHandlersMap<Tt>,
    selectors?: { [key: string]: (state: Tt) => any },
    dependentStores?: any[]
  ): StoreConfig<Tt> {
    const config = new StoreConfig<Tt>()
    config.name = name;
    config.initialState = initialState;
    config.handlers = handlers;
    config.selectors = selectors;
    config.dependentStores = dependentStores;
    return config;
  }
}
