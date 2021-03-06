import React, { useRef, useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import { render, waitForElement } from '@testing-library/react'

import Substitute from './Substitute';

const divToSpan = ({element, type, props}) => type === 'div' ? <span {...props} /> : element;
const DivToSpan = ({children}) => <Substitute mapElement={divToSpan}>{children}</Substitute>;

const spanToStrong = ({element, type, props}) => type === 'span' ? <strong {...props} /> : element;
const SpanToStrong = ({children}) => <Substitute mapElement={spanToStrong}>{children}</Substitute>;
const FancyDiv = (props) => {
  return <div className="fancy" {...props} />
};
const fancyDivToSummary = ({element, type, props}) => type === FancyDiv ? <summary {...props} /> : element;
const FancyDivToSummary = ({children}) => <Substitute mapElement={fancyDivToSummary}>{children}</Substitute>

it('works on root with one child', () => {
  const string = ReactDOMServer.renderToStaticMarkup(<DivToSpan><div>Hello</div></DivToSpan>);
  expect(string).toBe("<span>Hello</span>");
})

it('works on root with two children', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>
      <div>Hello</div>
      <div>Hello2</div>
    </DivToSpan>
  );
  expect(string).toBe("<span>Hello</span><span>Hello2</span>")
})

it('works with nested divs', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>
      <div>
        <div>Hello</div>
      </div>
    </DivToSpan>
  )
  expect(string).toBe("<span><span>Hello</span></span>")
})

it('works with a functional component', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>
      <FancyDiv>Hello</FancyDiv>
    </DivToSpan>
  )
  expect(string).toBe('<span class="fancy">Hello</span>')
})

it('works with nested functional components', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>
      <FancyDiv>
        <FancyDiv>Hello</FancyDiv>
      </FancyDiv>
    </DivToSpan>
  )
  expect(string).toBe('<span class="fancy"><span class="fancy">Hello</span></span>')
})

it('works with context', () => {
  const Ctx = React.createContext();
  const Consumer = () => {
    const ctx = React.useContext(Ctx);
    return <div>{ctx}</div>;
  };

  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>
      <Ctx.Provider value="Hello">
        <Consumer />
      </Ctx.Provider>
    </DivToSpan>
  )

  expect(string).toBe('<span>Hello</span>')
})

it('works with legacy context', () => {
  const Ctx = React.createContext();
  
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>
      <Ctx.Provider value="Hello">
        <Ctx.Consumer>
          {value => <div>{value}</div>}
        </Ctx.Consumer>
      </Ctx.Provider>
    </DivToSpan>
  )

  expect(string).toBe('<span>Hello</span>')
})

it('works nested', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <SpanToStrong>
      <div>One</div>
      <span>Two</span>
      <DivToSpan>
        <div>Three</div>
      </DivToSpan>
    </SpanToStrong>
  )

  expect(string).toBe("<div>One</div><strong>Two</strong><strong>Three</strong>")

})


it('works with dynamic updates', () =>{
  const Comp = () => {
    const [State, setState] = React.useState("summary");
    return (
      <summary>
        <State>myElement</State>
        <button onClick={() => setState('div')}>click me</button>
      </summary>
    )
  }

  const { getByText } = render(
    <DivToSpan>
      <Comp />
    </DivToSpan>
  ) 

  expect(getByText('myElement').outerHTML).toBe("<summary>myElement</summary>")
  getByText('click me').click()
  expect(getByText('myElement').outerHTML).toBe("<span>myElement</span>")
})

it('works with dynamic updates: classes', () =>{
  class CompClass extends React.Component {
    constructor(...args) {
      super(...args)
      this.state = {Tag: "summary"}
    }
    render () {
      const Tag = this.state.Tag;
      return (
        <summary>
          <Tag>myElement</Tag>
          <button onClick={() => this.setState({Tag: "div"})}>click me</button>
        </summary>
      )
    }
  }

  const { getByText } = render(
    <DivToSpan>
      <CompClass />
    </DivToSpan>
  ) 

  expect(getByText('myElement').outerHTML).toBe("<summary>myElement</summary>")
  getByText('click me').click()
  expect(getByText('myElement').outerHTML).toBe("<span>myElement</span>")
})

it('doesnt obfuscate types', () => {
    const string = ReactDOMServer.renderToStaticMarkup(
    <FancyDivToSummary>
      <DivToSpan>
        <p>
          <p>
            <FancyDiv>Hello</FancyDiv>
            <div>Hello2</div>
          </p>
        </p>
      </DivToSpan>
    </FancyDivToSummary>
  );

  expect(string).toBe('<p><p><summary>Hello</summary><span>Hello2</span></p></p>')
})

it('works with basic types', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <Substitute mapElement={({element, type}) => type === "string" ? "after" : element}>
      before
    </Substitute>
  )
  expect(string).toBe("after");
})

it('works with `null`', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>{null}</DivToSpan>
  )
  
  expect(string).toBe("");
})

it('works with `false`', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan>{false}</DivToSpan>
  )
  
  expect(string).toBe("");
})

it('works without children', () => {
  const string = ReactDOMServer.renderToStaticMarkup(
    <DivToSpan />
  )

  expect(string).toBe("");
})

it('throws without mapping function', () => {
  expect(() => ReactDOMServer.renderToStaticMarkup(
    <Substitute>foo</Substitute>
  )).toThrow(/Substitute has no mapElement/)
})

it('passes refs', () => {
  const Comp = () => {
    const ref = useRef();
    return (
      <div>
        <input ref={ref} value="before" onChange={() => {}} />
        <button onClick={() => ref.current.value = "after"}>click me</button>
      </div>
    )
  }
  const {getByDisplayValue, getByText} = render(
    <Substitute mapElement={({element, type, props}) => type === "input" ? <textarea {...props} /> : element}>
      <Comp />
    </Substitute>
  )

  expect(getByDisplayValue('before').tagName).toBe('TEXTAREA')
  getByText('click me').click();
  expect(getByDisplayValue('after').tagName).toBe('TEXTAREA')
})

it('works with lazy types: outside Suspense', async () => {
  const ctor = () => new Promise(ok => ok({
    default: ({greeting, children}) => <div>{greeting} {children}</div> 
  }));

  const Lazy = React.lazy(ctor)

  const { getByText } = render(
    <DivToSpan>
      <React.Suspense fallback={<div />}>
        <Lazy greeting="Hello">everybody</Lazy>
      </React.Suspense>
    </DivToSpan>      
  );
  const element = await waitForElement(() => getByText("Hello everybody"));
  expect(element.tagName).toBe("SPAN");
})

it('works with lazy types: inside Suspense', async () => {
  const ctor = () => new Promise(ok => ok({
    default: ({greeting, children}) => <div>{greeting} {children}</div> 
  }));

  const Lazy = React.lazy(ctor)

  const { getByText } = render(
    <React.Suspense fallback={<div />}>
      <DivToSpan>
        <Lazy greeting="Hello">everybody</Lazy>
      </DivToSpan>      
    </React.Suspense>
  );
  const element = await waitForElement(() => getByText("Hello everybody"));
  expect(element.tagName).toBe("SPAN");
})

it('works with portal types', () => {
  const el = document.createElement('div')
  document.body.appendChild(el);
  
  const Comp = () => {
    return ReactDOM.createPortal(
      <div>Hello</div>,
      el
    );
  }

  const { getByText } = render(
    <DivToSpan>
      <Comp />
    </DivToSpan>
  )

  expect(getByText("Hello").tagName).toBe("SPAN");
})

const Ctx = React.createContext();
const contextIntoSpan = ({element, getContext}) => {
  if (element.type === 'span') {
    const val = getContext(Ctx);
    return React.cloneElement(element, {children: val});
  }
  return element;
}
const ContextIntoSpan = ({children}) => <Substitute mapElement={contextIntoSpan}>{children}</Substitute>;

it('provides context getter', () => {
  const { getByText } = render(
    <Ctx.Provider value={'success'}>
      <ContextIntoSpan>
        <span>before</span>
      </ContextIntoSpan>
    </Ctx.Provider>
  )

  expect(getByText('success').tagName).toBe('SPAN');
})

it('works with forward-ref', () => {
  
})

it('works with memos', () => {
  
})

it('manages provider children correctly', () => {
  var hitCount = 0;
  var manipulateProvider;
  const Probe = ({children}) => {
    
    hitCount += 1;
    return children || null;
  }

  const Consumer = () => {
    const ctx = useContext(Ctx);
    return <span data-testid='consumer'>{ctx}</span>
  }

  const Provider = ({children}) => {
    const [state, setState] = useState('before');
    manipulateProvider = setState;
    return <Ctx.Provider value={state}>{children}</Ctx.Provider>
  }
  
  const {getByTestId} = render (
    <Substitute mapElement={({element}) => element}>
      <Provider>
        <Probe>
          <Probe />
        </Probe>
        <Consumer />
      </Provider>
    </Substitute>
  )

  expect(hitCount).toBe(2);
  manipulateProvider('after');
  expect(getByTestId('consumer').innerHTML).toBe('after');
  expect(hitCount).toBe(2);
})