import { forkJoin, Observable, of, Subject, Subscription } from "rxjs";
import { Store } from "./store";
import { XSLogger } from "./xs-logger";
import { StoreHandler } from "./store-handler";
import { ActionHandlers } from "./types";
import { XSRootContext } from './xs-root-context';
import { mergeMap, tap } from "rxjs/operators";
import { Action } from './action';

class RedXSBus {
  
  private _actionHandlerHash: { [actionType: string]: ActionHandlers<any> } = {  };
  private _dispatchedActions$ = new Subject();
  private _subscription = new Subscription();
  private _dispatchSubscribedTo = false;

  private _propagateActionHandlers(store: Store<any>) {

    Object.keys(store.handlers).forEach((key: string) => {
      this._actionHandlerHash[key] = (this._actionHandlerHash[key] || []) as any;
      if (Array.isArray(store.handlers[key])) {
        (store.handlers[key] as any).forEach((actionHandler: (...args: any[]) => any) => {
          (this._actionHandlerHash[key] as any).push(new StoreHandler(store, actionHandler));
        });
      } else {
        (this._actionHandlerHash[key] as any).push(new StoreHandler(store, store.handlers[key]));
      }
    });
  }

  private _getActionHandlers(topic: string): any {
    return this._actionHandlerHash[topic] || [new StoreHandler({ name: 'noop' } as any, () => {})];
  }
  
  private _initSubscriptionToDispatchedActions() {
    if (this._dispatchSubscribedTo) { return; }

    this._subscription.add(
      this._dispatchedActions$.pipe(
        tap((action) => XSLogger.logDispatchedActionStart(action, XSRootContext.getState())),
        mergeMap((action) => {

          const actionHandlers = this._getActionHandlers(Action.getType(action));

          return forkJoin(
            actionHandlers.map((storeAndHandler: StoreHandler) => 
              of(storeAndHandler.callback(
                XSRootContext.getStateContext(storeAndHandler.store.name),
                action
              ))
            )
          )

        }),
        tap(() => XSLogger.logDispatchedActionEnd(XSRootContext.getState())) // move to subscribe() ?
      )
      .subscribe(() => {})
    );

    this._dispatchSubscribedTo = true;
  }

  constructor(){
    this._initSubscriptionToDispatchedActions();
  }

  registerStore(store: Store<any>): void {
    this._propagateActionHandlers(store);
  }

  dispatch(action: any): Observable<void> {
    return of(this._dispatchedActions$.next(action));
  }

}

export const XSBus = new RedXSBus();
export default XSBus;