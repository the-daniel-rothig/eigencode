import React from 'react';
import { render } from '@testing-library/react';

const renderFunction = jest.fn();
let getByText = null;

class Comp extends React.Component {
  pokeState() {
    this.setState({})
  }

  setStateToEquivalent() {
    this.setState({...this.state})
  }

  setStateToSame() {
    this.setState(this.state);
  }

  render() {
    renderFunction();
    return (
      <div>
        <button onClick={() => this.pokeState()}>poke state</button>
        <button onClick={() => this.setStateToEquivalent()}>set state to equivalent</button>
        <button onClick={() => this.setStateToSame()}>set state to same</button>
      </div>
    )
  }
}

beforeEach(() => {
  getByText = render(<Comp />).getByText;
  renderFunction.mockReset();
  expect(renderFunction).not.toHaveBeenCalled();
})

it('triggers when state is poked', () => {
  getByText('poke state').click();
  expect(renderFunction).toHaveBeenCalled();
})

it('triggers when state is replaced with same values', () => {
  getByText('set state to equivalent').click();
  expect(renderFunction).toHaveBeenCalled();
})

it('does NOT trigger when state is replaced with same value object', () => {
  getByText('set state to same').click();
  expect(renderFunction).not.toHaveBeenCalled();
})