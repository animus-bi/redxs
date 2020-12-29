import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { /*catchError,*/ mergeMap, tap } from 'rxjs/operators';
import { ActionHandlers } from './types/action-handlers';
import { Action } from './action';
import { xsStateContext } from './redxs-state-context';
import { StateContext } from './state-context';
import { Store } from './store';
import { StoreHandler as StoreHandler } from './store-handler';
import { RedXSLogger } from './redxs-logger';



export abstract class RootStore {
  private _logger: RedXSLogger = new RedXSLogger();
  private _actionHandlerHash: { [actionType: string]: ActionHandlers<any> } = {  };
  private _dispatchedActions$ = new Subject();
  private _subscription = new Subscription();

  isInitialized = false;
  
  private _initSlices() {
    return Object.keys(this)
      .filter((key) => (this[key] instanceof Store))
      .forEach((key) => this._registerSlice(this[key]));
  }

  private _registerSlice(store: Store<any>) {
    this._populateActionHandlerHash(store);
    this._setSliceStateContext(store);
    this._setInitialState(store);
  }

  private _setInitialState(store: Store<any>) {
    this._logger.logDispatchedActionStart({ type: `Adding Slice [${store.name}]` }, xsStateContext.getState(), false);
    this._setStoreState(store, store.initialState);
    this._logger.logDispatchedActionEnd(xsStateContext.getState());
  }

  private _setSliceStateContext<T>(store: Store<any>) {
    store.context = new StateContext<T>(
      () => ({ ...xsStateContext.getStateSlice(store.name) }),
      (action?: any) => this.dispatch(action),
      (state: T) => this._setStoreState(store, state),
      (state: Partial<T>) => this._patchStoreState(store, state),
    );
  }

  private _populateActionHandlerHash(store: Store<any>) {

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

  private _noopStoreHandler() {
    return new StoreHandler({ context: null } as any, () => {});
  }

  private _initSubscriptionToDispatchedActions() {
    this._subscription.add(
      this._dispatchedActions$.pipe(
        tap((action) => this._logger.logDispatchedActionStart(action, xsStateContext.getState())),
        mergeMap((action) => {
          const storeHandler = ((this._actionHandlerHash[ Action.getType(action) ] || [this._noopStoreHandler()]) as any);
          
          return forkJoin(
            storeHandler.map((storeHandler: StoreHandler) => {
              return of(storeHandler.callback(storeHandler.store.context, action) || {});
            })
          )

        }),
        tap(() => this._logger.logDispatchedActionEnd(xsStateContext.getState())) // move to subscribe() ?
      )
      .subscribe(() => {})
    )
  }

  private _setStoreState(store: Store<any>, state: any): Observable<void> {
    return of(xsStateContext.pushSliceState(store.name, state));
  }

  private _patchStoreState(store: Store<any>, state: any): Observable<void> {
    const stateSlice = { ...xsStateContext.getStateSlice(store.name), ...(state || {}) };
    return this._setStoreState(store, stateSlice);
  }

  private _initRootStateContext() {
    xsStateContext.init();
  }

  dispatch(action: any): Observable<void> {
    return of(this._dispatchedActions$.next(action));
  }

  init(enableLogging: boolean = false) {
    if (this.isInitialized) {
      return this;
    }

    this._logger = new RedXSLogger(enableLogging);
    this._initRootStateContext();
    this._initSlices();
    this._initSubscriptionToDispatchedActions();
    this.isInitialized = true;

    return this;
  }

}