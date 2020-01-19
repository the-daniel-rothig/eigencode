import React, { useState, useContext } from 'react'
import { act } from 'react-dom/test-utils'
import { render, wait } from '@testing-library/react'
import CustomRenderer from './CustomRenderer'
import CustomRenderFunction from './CustomRenderFunction'
import textRenderer from './reducers/textRenderer'


it('doesnt explode', () => {
  render(
  <CustomRenderer customRenderFunction={textRenderer} onFinish={() => {}}>
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
    </CustomRenderer>)
})

it('simple case', done => {
  render(
    <CustomRenderer customRenderFunction={textRenderer} onFinish={assertResult}>
      <div><span>One</span></div>
    </CustomRenderer>
  )

  function assertResult(res) {
    expect(res).toBe("One")
    done();
  }
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
    <CustomRenderer customRenderFunction={textRenderer} onFinish={assertResult}>
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
    </CustomRenderer>
  )


  function assertResult(res) {
    expect(res).toBe(expectedValue)
    done();
  }
})

it('resolves with empty tags', (done) => {
  render(
    <CustomRenderer customRenderFunction={textRenderer} onFinish={assertResult}>
      <div>
        <span>Hello</span>
        <br />
        <span>World.</span>
      </div>
    </CustomRenderer>
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
  const contextIntoSpan = new CustomRenderFunction({
    reduce: ({element, getContext, unbox}) => {
      if (element.type === 'span') {
        return {
          wantsSpacing: false,
          value: getContext(Ctx)
        }
      }
      else return textRenderer.reduce({element, unbox})
    },
    finalTransform: textRenderer.finalTransform
  })
  
  render(
    <Ctx.Provider value={'success!'}>
      <CustomRenderer customRenderFunction={contextIntoSpan} onFinish={assertResult}>
        <div>
          <div>Hello</div>
          <span>World.</span>
        </div>
      </CustomRenderer>
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
    return <CustomRenderer customRenderFunction={textRenderer} onFinish={() => {ctx.setValue('after')}}>{children}</CustomRenderer>
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

it('updates correctly when arrays change', async () => {
  let externalSetState
  const Component = () => {
    const [items, setItems] = useState(['one', 'two'])
    externalSetState = setItems;

    return (
      <>
        {items.map(x => <div>{x}</div>)}
        <button onClick={() => setItems(x => [...x, 'three'])}>click me</button>
      </>
    );
  }

  let result = "";
  const { getByText } = render(
    <CustomRenderer customRenderFunction={textRenderer} onFinish={x => result = x}>
      <Component />
    </CustomRenderer>
  )

  expect(result).toBe('one\ntwo\nclick me');
  act(() => getByText('click me').click());
  await wait(() => expect(result).toBe('one\ntwo\nthree\nclick me'));
  act(() => externalSetState(x => [...x, 'four']));
  await wait(() => expect(result).toBe('one\ntwo\nthree\nfour\nclick me'));
  act(() => externalSetState(x => ['one']));
  await wait(() => {
    expect(result).toBe('one\nclick me')
  });
})