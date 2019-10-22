import React, { useState, useContext } from 'react';
import { render } from '@testing-library/react';
import ContextFilter from './ContextFilter';

const Context = React.createContext()

it('converts context', () => {
  const probe = jest.fn()
  const Surrounding = ({children}) => {
    const [foo, setFoo] = useState(0)
    const [bar, setBar] = useState(0)

    return (
      <>
        <Context.Provider value={{foo, bar}}>
          {children}
        </Context.Provider>
        <button onClick={() => setFoo(foo+1)}>increment foo</button>
        <button onClick={() => setBar(bar+1)}>increment bar</button>
      </>
    )
  }

  
  const Probe = () => {
    const ctx = useContext(Context);
    probe();
    return <div data-testid='probe'>{ctx.foo}</div>
  }

  const { getByText, getByTestId } = render(
    <Surrounding>
      <ContextFilter of={Context} map={one => ({foo: one.foo})}>
        <Probe />
      </ContextFilter>
    </Surrounding>
  )

  expect(probe).toHaveBeenCalledTimes(1)
  expect(getByTestId("probe").innerHTML).toBe("0")
  
  getByText('increment bar').click()
  expect(probe).toHaveBeenCalledTimes(1)
  expect(getByTestId("probe").innerHTML).toBe("0")
  
  getByText('increment foo').click()
  expect(probe).toHaveBeenCalledTimes(2)
  expect(getByTestId("probe").innerHTML).toBe("1")
});