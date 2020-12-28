import { Action } from '../src/action';

import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Action test', () => {
  class SomeGoodAction {
    someProp = 'prop'
    static Type = 'foo';
  }

  class SomeBadAction { }

  const someGoodAction = {
    someProp: 'prop',
    type: 'foo'
  }

  const actions = [
    { action: new SomeGoodAction(), result: { type: 'foo', someProp: 'prop'  } },
    { action: new SomeBadAction(), result: { type: 'SomeBadAction' } },
    { action: someGoodAction, result: { type: 'foo', someProp: 'prop'  } }
  ]

  actions.forEach((dispatched) => {

    it(`should parse type as ${dispatched.result.type}`, () => {
      expect(Action.getType(dispatched.action)).to.equal(dispatched.result.type);
    });

    it (`should parse action ${JSON.stringify(dispatched.result)}`, () => {
      expect(Action.parse(dispatched.action)).to.eql(dispatched.result);
    });

  });
  
});
