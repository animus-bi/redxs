import { StateContext } from '../state-context';


export type ActionHandlers<T> = 
  (context?: StateContext<T>, action?: { type: string; payload?: any; }) => any | any[];
