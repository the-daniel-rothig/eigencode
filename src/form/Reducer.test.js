import React from 'react'
import { render } from '@testing-library/react'
import Reducer from './Reducer'
import expectExport from 'expect'
import extractText from '../reduces/extractText'

it('doesnt explode', () => {
  render(
  <Reducer reduce={extractText} onFinish={() => {}}>
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
    </Reducer>)
})

it('lets me extract text', () => {
  const expectedValue = 
`One two. Three
FourFive .
Six
Seven
Eight
.`;

  render(
    <Reducer reduce={extractText} onFinish={assertResult}>
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
    </Reducer>
  )


  function assertResult(res) {
    expect(res.value).toBe(expectedValue)
  }
})

it('resolves with empty tags', (done) => {
  render(
    <Reducer reduce={extractText} onFinish={assertResult}>
      <div>
        <span>Hello</span>
        <br />
        <span>World.</span>
      </div>
    </Reducer>
  )
  function assertResult(res) {
    expect(res.value).toBe(
`Hello
World.`);
    done();
  }
})

it('passes though getContext', done => {
  const Ctx = React.createContext();
  const contextIntoSpan = ({element, getContext, unbox}) => {
    if (element.type === 'span') {
      return {
        wantsSpacing: false,
        value: getContext(Ctx)
      }
    }
    else return extractText({element, unbox})
  };

  render(
    <Ctx.Provider value={'success!'}>
      <Reducer reduce={contextIntoSpan} onFinish={assertResult}>
        <div>
          <div>Hello</div>
          <span>World.</span>
        </div>
    </Reducer>
    </Ctx.Provider>
  )
  function assertResult(res) {
    expect(res.value).toBe('Hello\nsuccess!');
    done();
  }

})