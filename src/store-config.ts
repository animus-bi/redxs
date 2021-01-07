import { Observable } from 'rxjs/internal/Observable';
import { ActionHandlersMap } from './types/action-handlers-map';


export class StoreConfig<T> {
  name: string | undefined;
  initialState: T | undefined;
  handlers: ActionHandlersMap<T> | undefined;
  selectors?: { [key: string]: Observable<any> } | undefined;

  static create<Tt>(
    name: string,
    initialState: Tt,
    handlers: ActionHandlersMap<Tt>,
    selectors?: { [key: string]: Observable<any> }
  ): StoreConfig<Tt> {
    const config = new StoreConfig<Tt>()
    config.name = name;
    config.initialState = initialState;
    config.handlers = handlers;
    config.selectors = selectors;
    return config;
  }
}
