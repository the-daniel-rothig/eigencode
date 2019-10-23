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
    expect(res.value).toBe("One two. Three FourFive . Six Seven Eight .")
  }
})