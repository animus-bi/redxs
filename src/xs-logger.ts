import { Action } from './action';

const _cloneDeep = require('lodash.clonedeep');
const grayLogStyle = 'color: #979797; font-weight: 700';
const greenLogStyle = 'color: #02a102; font-weight: 700';
const dupe = (obj: any) => _cloneDeep(obj);

export class RedXSLogger {

  private _noOpConsole = {
    log: (..._: any[]) => {},
    group: (_: string) => {},
    groupEnd: () => {},
    error: (..._: any[]) => {},
    info: (..._: any[]) => {}
  }

  private _console: any = console;
    
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

  private _startLogGroup(action: any, topic = 'action ') {
    this._console.group(`${topic}${Action.getType(action)}`);
  }

  private _endLogGroup() {
    this._console.groupEnd();
  }

  enableLogging(bool: boolean = true) {
    this._console = bool ? console : this._noOpConsole;
  }

  disableLogging() {
    this.enableLogging(false);
  }

  logError(err: any) {
    this._console.error(err);
  }

  logDispatchedActionStart(action: any, previousState: any, topic = 'action ') {
    this._startLogGroup(action, topic);
    this._logPayload(action);
    this._logPrevState(previousState);
  }

  logDispatchedActionEnd(nextState: any) {
    this._logNextState(nextState);
    this._endLogGroup();
  }

}

export const XSLogger = new RedXSLogger();
export default XSLogger;