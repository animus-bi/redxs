import { Action } from './action';
import { xsStateContext } from './redxs-state-context';

const grayLogStyle = 'color:  #979797; font-weight: 700';
const greenLogStyle = 'color: #02a102; font-weight: 700';

export class RedXSLogger {

  private _console = {
    log: (..._: any[]) => {},
    group: (_: string) => {},
    groupEnd: () => {}
  }

  constructor(public isLogging: boolean = false) {
    if (this.isLogging) {
      this._console = console;
    }
  }
    
  private _logPayload(action: any) {
    if (action.payload) {
      this._console.log('%cpayload', grayLogStyle, action.payload);
    }
  }
  
  private _logPrevState(prevState: any) {
    this._console.log('%cprev state', grayLogStyle, prevState);
  }
  
  private _logNextState(nextState: any) {
    this._console.log('%cnext state', greenLogStyle, nextState);
  }

  private _startLogGroup(action: any, isAction = true) {
    this._console.group(`${isAction ? 'action' : '' } ${Action.getType(action)}`);
  }

  private _endLogGroup() {
    this._console.groupEnd();
  }

  logDispatchedActionStart() {
    return (action: any, isAction = true) => {
      this._startLogGroup(action, isAction);
      this._logPayload(action);
      this._logPrevState(xsStateContext.getState());
    }
  }
  
  logDispatchedActionEnd() {
    return () => {
      this._logNextState(xsStateContext.getState());
      this._endLogGroup();
    }
  }

  

}