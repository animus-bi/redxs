import { Action } from './action';

const grayLogStyle = 'color:  #979797; font-weight: 700';
const greenLogStyle = 'color: #02a102; font-weight: 700';
const dupe = (obj: any) => JSON.parse(JSON.stringify(obj));

export class RedXSLogger {

  private _console = {
    log: (..._: any[]) => {},
    group: (_: string) => {},
    groupEnd: () => {},
    error: (..._: any[]) => {},
    info: (..._: any[]) => {}
  }

  constructor(public isLogging: boolean = false) {
    if (this.isLogging) {
      this._console = console;
    }
  }
    
  private _logPayload(action: any) {
    const payload = Action.withoutType(action);
    if (Object.keys(payload).length) {
      this._console.log('%cpayload', grayLogStyle, payload);
    }
  }
  
  private _logPrevState(prevState: any) {
    this._console.log('%cprev state', grayLogStyle, dupe(prevState));
  }
  
  private _logNextState(nextState: any) {
    this._console.log('%cnext state', greenLogStyle, dupe(nextState));
  }

  private _startLogGroup(action: any, isAction: boolean) {
    this._console.group(`${isAction ? 'action' : '' } ${Action.getType(action)}`);
  }

  private _endLogGroup() {
    this._console.groupEnd();
  }

  logError(err: any) {
    this._console.error(err);
  }

  logDispatchedActionStart(action: any, previousState: any, isAction: boolean = true) {
    this._startLogGroup(action, isAction);
    this._logPayload(action);
    this._logPrevState(previousState);
  }

  logDispatchedActionEnd(nextState: any) {
    this._logNextState(nextState);
    this._endLogGroup();
  }

}