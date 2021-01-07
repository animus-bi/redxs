import { StateContext } from '../state-context';


export type ActionHandlers<T> = 
  (context?: StateContext<T>, action?: any) => any |
    ((context?: StateContext<T>, action?: any) => any)[] | any;
