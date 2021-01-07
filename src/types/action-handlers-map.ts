import { ActionHandlers } from './action-handlers';


export type ActionHandlersMap<T> = { [actionType: string]: ActionHandlers<T>; } | any;
