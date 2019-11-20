import React, { useState, useContext } from 'react'
import { render } from '@testing-library/react'
import Reducer2 from './Reducer2'
import extractText from './reducers/extractText'
import { ReducerFunction } from '.'

it('doesnt explode', () => {
  render(
  <Reducer2 reducerFunction={extractText} onFinish={() => {}}>
    <div>
        One
      <div>
          {'One'}
          {'Two'}          
        <div>
            Hello            
            {'One'}
            {'Two'}
            <div />
            {'Three'} 
          </div>
        </div>
      </div>
    </Reducer2>)
})

it('lets me extract text', (done) => {
  const expectedValue = 
`One two. Three
FourFive .
Six
Seven
Eight
.`;

  render(
    <Reducer2 reducerFunction={extractText} onFinish={assertResult}>
      <div>
        One <span>two</span>.
        Three
      </div>
      <div>
        Four
        <span>Five</span>{' '}
        .
      </div>
      <div>
        Six<br />Seven
        <div>Eight</div>
        .
      </div>
    </Reducer2>
  )


  function assertResult(res) {
    expect(res).toBe(expectedValue)
    done();
  }
})

it('resolves with empty tags', (done) => {
  render(
    <Reducer2 reducerFunction={extractText} onFinish={assertResult}>
      <div>
        <span>Hello</span>
        <br />
        <span>World.</span>
      </div>
    </Reducer2>
  )
  function assertResult(res) {
    expect(res).toBe(
`Hello
World.`);
    done();
  }
})

it('passes though getContext', done => {
  const Ctx = React.createContext();
  const contextIntoSpan = new ReducerFunction(({element, getContext, unbox}) => {
    if (element.type === 'span') {
      return {
        wantsSpacing: false,
        value: getContext(Ctx)
      }
    }
    else return extractText.reduce({element, unbox})
  }, undefined, undefined, extractText.finalTransform);

  render(
    <Ctx.Provider value={'success!'}>
      <Reducer2 reducerFunction={contextIntoSpan} onFinish={assertResult}>
        <div>
          <div>Hello</div>
          <span>World.</span>
        </div>
      </Reducer2>
    </Ctx.Provider>
  )
  function assertResult(res) {
    expect(res).toBe('Hello\nsuccess!');
    done();
  }

})
 
it('manages provider children correctly', async () => {
  const Ctx = React.createContext();
  
  var hitCount = 0;
  var manipulateProvider;
  const Probe = ({children}) => {
    
    hitCount += 1;
    return children || null;
  }

  const Consumer = () => {
    const ctx = useContext(Ctx);
    return <span data-testid='consumer'>{ctx.value}</span>
  }

  const Provider = ({children}) => {
    const [value, setValue] = useState('');
    manipulateProvider = setValue;
    return <Ctx.Provider value={{value, setValue}}>{children}</Ctx.Provider>
  }
  const WithReducer = ({children}) => {
    const ctx = Ctx._currentValue;//useContext(Ctx);
    return <Reducer2 reducerFunction={extractText} onFinish={() => {ctx.setValue('after')}}>{children}</Reducer2>
  }
  
  const {getByTestId} = render (
    <Provider>
      <WithReducer>
        <Probe>
          <Probe />
        </Probe>
        <Consumer />
      </WithReducer>
    </Provider>
  )
  expect(hitCount).toBe(2);

  await new Promise(ok => setTimeout(ok,10));

  //manipulateProvider('after');
  expect(getByTestId('consumer').innerHTML).toBe('after');
  expect(hitCount).toBe(2);
})