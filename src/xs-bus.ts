import {
  forkJoin,
  isObservable,
  Observable,
  of,
  Subject,
  Subscription
} from 'rxjs';
import { catchError, filter, mergeMap, tap } from 'rxjs/operators';

import { Action } from './action';
import { OnActionStatus } from './constants';
import { Store } from './store';
import { StoreHandler } from './store-handler';
import { ActionHandlers, ActionStatus } from './types';
import { XSLogger } from './xs-logger';
import { XSRootContext } from './xs-root-context';

class RedXSBus {
  
  private _actionHandlerHash: { [actionType: string]: ActionHandlers<any> } = {  };
  private _dispatchedActions$ = new Subject();
  private _actionStatuses$ = new Subject<ActionStatus>();
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
          const actionHandlers = this._getActionHandlers(Action.getType(action)) as StoreHandler[];

          return forkJoin(actionHandlers.map(
            (storeHandler: StoreHandler) => this._handleDispatchedAction(action, storeHandler)
          ));
        }),
        tap(() => XSLogger.logDispatchedActionEnd(XSRootContext.getState())) // move to subscribe() ?
      )
      .subscribe(() => {})
    );

    this._dispatchSubscribedTo = true;
  }

  private _handleDispatchedAction(action: any, storeHandler: StoreHandler) {
    let callbackResult: any,
        callbackResultObservable: Observable<any>;
    const stateContext = XSRootContext.getStateContext(storeHandler.store.name);

    try {
      callbackResult = storeHandler.callback(stateContext, action);
    } catch(error) {
      return of(this._notifyActionStatuses(action, OnActionStatus.OnError, error));
    }

    callbackResultObservable = isObservable(callbackResult)
      ? callbackResult
      : of(callbackResult);

    return (callbackResultObservable as Observable<any>).pipe(
      mergeMap(result => of(this._notifyActionStatuses(action, OnActionStatus.OnSuccess, result))),
      catchError(error => of(this._notifyActionStatuses(action, OnActionStatus.OnError, error))),
      mergeMap(result => of(this._notifyActionStatuses(action, OnActionStatus.OnComplete, result)))
    );
  }

  private _notifyActionStatuses(action: any, status: string, callbackResult: any) {
    this._actionStatuses$.next({ action, status, callbackResult });
  }

  constructor(){
    this._initSubscriptionToDispatchedActions();
  }

  registerStore(store: Store<any>): void {
    this._propagateActionHandlers(store);
  }

  dispatch(action: any): Observable<void> {
    this._notifyActionStatuses(action, OnActionStatus.OnDispatch, null);

    return of(this._dispatchedActions$.next(action));
  }

  onActionStatus(action: any, status: string): Observable<any> {
    const statusMap = {
      dispatch: OnActionStatus.OnDispatch,
      success: OnActionStatus.OnSuccess,
      error: OnActionStatus.OnError,
      complete: OnActionStatus.OnComplete
    };

    return this._actionStatuses$.pipe(filter((actionStatus: ActionStatus) => {
      return action.name === actionStatus.action.constructor.name
        && statusMap[status] === actionStatus.status;
    }));
  }

}

export const XSBus = new RedXSBus();
export default XSBus;