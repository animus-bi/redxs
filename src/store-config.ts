import { ActionHandlersMap } from './types/action-handlers-map';


export class StoreConfig<T> {
  name: string | undefined;
  initialState: T | undefined;
  handlers: ActionHandlersMap<T> | undefined;

  static create<Tt>(name: string, initialState: Tt, handlers: ActionHandlersMap<Tt>): StoreConfig<Tt> {
    const config = new StoreConfig<Tt>()
    config.name = name;
    config.initialState = initialState;
    config.handlers = handlers;
    return config;
  }
}
