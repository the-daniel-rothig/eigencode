import React, {useState} from 'react';
import { CustomRenderer, textRenderer as textRendererHacked } from "react-custom-renderer";
import { render, wait } from "@testing-library/react";
import { act } from "react-dom/test-utils";

const Ctx = React.createContext();

class LazyComponent extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.children !== this.props.children;
  }
  render() {
    return <div>{this.props.children}</div>
  }
}

it('updates correctly when memos are present', async () => {
  let externalSetState
  const Component = () => {
    const [items, setItems] = useState(['one', 'two'])
    externalSetState = setItems;

    return (
      <>
        {items.map(x => (
          // stops re-evaluation - need to ensure results will still be available
          // on next re-render
          <LazyComponent>
            {x}
          </LazyComponent>
        ))}
        <button onClick={() => setItems(x => [...x, 'three'])}>click me</button>
      </>
    );
  }

  let result = "";
  const { getByText } = render(
    <Ctx.Provider value={'ctxValue'}>
      <CustomRenderer customRenderFunction={textRendererHacked} onFinish={x => result = x}>
        <div>
          <Component />
        </div>
      </CustomRenderer>
    </Ctx.Provider>
  )

  expect(result).toBe('one\ntwo\nclick me');
  act(() => getByText('click me').click());
  await wait(() => expect(result).toBe('one\ntwo\nthree\nclick me'));
  act(() => externalSetState(x => [...x, 'four']));
  await wait(() => expect(result).toBe('one\ntwo\nthree\nfour\nclick me'));
  act(() => externalSetState(x => ['one']));
  await wait(() => expect(result).toBe('one\nclick me'));
})