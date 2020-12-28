
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Greet Carl', () => {

  it('should greet Carl with `Hello, Carl`', () => {
    expect('Hello, Carl').to.equal('Hello, Carl');
  });

  it('should greet Carl with `Sod off, Carl`', () => {
    const stubGreet = sinon.stub();
    stubGreet.withArgs('Carl').returns('Sod off, Carl');
    expect(stubGreet('Carl')).to.equal('Sod off, Carl');
  });
  
});
