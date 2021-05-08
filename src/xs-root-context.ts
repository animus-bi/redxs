import { Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { XSLogger } from './xs-logger';
import { StateContext } from './state-context';
import { Store } from './store';

// const _isEqual = require('lodash.isequal');

class RedXSStateContext {
  private _state = {} as any;
  private _state$ = new Subject();
  private _slices: { [key: string]: ReplaySubject<any> } = { };
  private _stateContexts: { [key: string]: StateContext<any> } = { };
  private _subscription = new Subscription();
  private _rootStateSubscribedTo = false;

  get state$(): Observable<any> {
    return this._state$;
  }

  private _createStateContext<T>(store: Store<T>) {

    this._stateContexts[store.name] = new StateContext<T>(
      () => ({ ...this._getStateSlice(store.name) }),
      (action?: any) => store.dispatch(action),
      (state: T) => this._setSliceState.bind(this)(store.name, state),
      (state: Partial<T>) => this._patchSliceState.bind(this)(store.name, state),
    );

  }

  private _initializeRootStateSubscription() {
    if (this._rootStateSubscribedTo) { return; }

    this._subscription.add(
      this._state$.subscribe((state: any) => {
        this._state = { ...state };
      })
    );

    this._rootStateSubscribedTo = true;
  }

  private _patchSliceState<T>(sliceName: string, state: Partial<T>): Observable<any> {
    return this._setSliceState(sliceName, {
      ...this._getStateSlice(sliceName),
      ...state
    })
  }

  private _setInitialState(store: Store<any>) {
    XSLogger.logDispatchedActionStart({ type: `[${store.name}]` }, this.getState(), 'Initializing Slice ');
    this._setSliceState(store.name, store.initialState);
    XSLogger.logDispatchedActionEnd(this.getState());
  }

  private _setSliceState<T>(sliceName: string, state: T): Observable<any> {
    this._subscribeToSlice(sliceName);
    return of(this._slices[sliceName].next(state));
  }

  private _subscribeToSlice(sliceName: string) {
    if (!sliceName) { return; }
    
    if (!this._slices[sliceName]) { 
      this._slices[sliceName] = new ReplaySubject<any>(1);
      this._subscription.add(
        this._slices[sliceName].subscribe((sliceState: any) => {
          const previousState = { ...this.getState() };
          const nextState = { ...previousState, ...{ [sliceName]: { ...sliceState } } };
          this._state$.next(nextState);
        })
      );
    }
  }

  constructor() {
    this._initializeRootStateSubscription();
  }

  createRootSelector<Tt>(predicate: (state: Tt) => any) {
    return this._state$.pipe(
      map((rootState: any) => predicate(rootState)),
      distinctUntilChanged() //(prev, curr) => _isEqual(prev) === _isEqual(curr)),
    );
  }

  createSliceSelector<Tt>(sliceName: string, predicate: (state: Tt) => any) {
    this._subscribeToSlice(sliceName);
    return this._slices[sliceName].pipe(
      map((sliceState: any) => predicate(sliceState)),
      distinctUntilChanged() //(prev, curr) => _isEqual(prev) === _isEqual(curr))
    );
  }

  getState(): any {
    return { ...this._state };
  }

  getStateContext<T>(sliceName: string) {
    return this._stateContexts[sliceName] || new StateContext<T>(
      () => ({ } as any),
      (action?: any) => Store.Dispatch(action),
      (state: T) => this._setSliceState.bind(this)('nostore', state),
      (state: Partial<T>) => this._patchSliceState.bind(this)('nostore', state),
    )
  }

  private _getStateSlice(sliceName: string) {
    return this.getState()[sliceName] || { };
  }

  registerStore(store: Store<any>) {
    this._createStateContext(store);
    this._setInitialState(store);
  }

}

export const XSRootContext = new RedXSStateContext();
export default XSRootContext;