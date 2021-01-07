import { Observable } from "rxjs";
import { XSRootContext } from "./xs-root-context";

export class StateContext<T> {

  getRootState() {
    return XSRootContext.getState();
  }

  getSlice(name: string) {
    return XSRootContext.getState()[name];
  }

  constructor(
    public getState: () => T,
    public dispatch: (...args: any) => Observable<void>,
    public setState: (state: T) => Observable<void>,
    public patchState: (patch: Partial<T>) => Observable<void>,
  ) { }
}
