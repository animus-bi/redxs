import { ReplaySubject, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';


class RedXSStateContext<T> {
  private _state: T = {} as any;
  private _state$ = new Subject();
  private _slices: { [key: string]: ReplaySubject<any> } = { }
  private _subscription = new Subscription();
  private _isInitialized = false;

  private initializeRootStateSubscription() {
    this._subscription.add(
      this._state$.subscribe((state: any) => {
        this._state = { ...state };
      })
    );
  }

  private subscribeToSlice(sliceName: string) {
    if (!sliceName) { return; }
    
    if (!this._slices[sliceName]) { 
      this._slices[sliceName] = new ReplaySubject<T>(1);
    }

    this._subscription.add(
      this._slices[sliceName].subscribe((nextVersionOfSlice: any) => {
        const previousState = { ...this.getState() };
        const nextState = { ...previousState, ...{ [sliceName]: { ...nextVersionOfSlice } } };
        this._state$.next(nextState);
      })
    );
  }



  pushSliceState(sliceName: string, state: T) {
    if (!this._slices[sliceName]){
      this.subscribeToSlice(sliceName);
    }

    this._slices[sliceName].next(state);
  }

  init() {
    if (this._isInitialized) {
      return;
    }

    this.initializeRootStateSubscription();
    this._isInitialized = true;
  }

  getState(): any {
    return { ...this._state };
  }

  getStateSlice(sliceName: string) {
    return this.getState()[sliceName] || { };
  }

  createSliceSelector<Tt>(sliceName: string, predicate: (state: Tt) => any) {
    if (!this._slices[sliceName]) {
      this.subscribeToSlice(sliceName);
    }

    return this._slices[sliceName].pipe(map((sliceState: any) => predicate(sliceState)));
  }

}

export const xsStateContext = new RedXSStateContext();
export default xsStateContext;