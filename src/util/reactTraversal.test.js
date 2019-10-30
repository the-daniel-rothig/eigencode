import React, { useContext, useState, useReducer } from 'react';
import ReactDOM from 'react-dom';
import { traverseDepthFirst, traverseWidthFirst } from './reactTraversal';

const Ctx = React.createContext();
  
const flatten = ({array}) => array.filter(Boolean).map(x => x.toString().trim()).filter(Boolean).join(" ");
const expectTextContent = (element) => {
  const res = traverseDepthFirst(element, ({unbox}) => flatten({array: unbox()}))
  return expect(res);
};

it('allows me to mock the dispatcher', () =>{
  const Comp = ({children}) => {
    const [salutation] = useState("Hello")
    return <div>{salutation} {children}</div>;
  }

  expectTextContent(<Comp>everybody</Comp>).toBe("Hello everybody");
})

it('injects context', () => {
  const Prov = ({children}) => <Ctx.Provider value={"success"}>{children}</Ctx.Provider>
  const Consumer = () => {
    const value = useContext(Ctx);
    return <div>{value}</div>;
  }

  expectTextContent(<Prov><Consumer /></Prov>).toBe('success');
})

it('gets past fragments', () => {
  expectTextContent(<React.Fragment><div>Hello</div></React.Fragment>).toBe("Hello")
})

it('gets past fragments (concise syntax)', () => {
  expectTextContent(<><div>Hello</div></>).toBe("Hello")
})

it('is depth first', () => {
  expectTextContent(
    <div>
      <div>
        <span>One</span>
        <span>Two</span>
      </div>
      <span>Three</span>
    </div>
  ).toBe("One Two Three");
})

it('understands numbers', () => {
  expectTextContent(<div>{42}</div>).toBe("42");
})

it('ignores pure Booleans', () => {
  expectTextContent(<div>{true}</div>).toBe("");
})

it('works with lazy types', async () => {
  const ctor = () => new Promise(ok => ok({
    default: ({greeting, children}) => <div>{greeting} {children}</div> 
  }));

  const Lazy = React.lazy(ctor)

  const res = await traverseDepthFirst(
    <React.Suspense>
      <Lazy greeting="Hello">everybody</Lazy>
      <div> woo hoo</div>
    </React.Suspense>,
    async ({unbox}) => (await unbox()).join("")
  );
  expect(res).toBe("Hello everybody woo hoo");
})

it('works with portal types', () => {
  const Comp = () => ReactDOM.createPortal(
    <div>Hello</div>,
    {nodeType: 1}
  );
  expectTextContent(<Comp />).toBe("Hello")
})

class CompClass extends React.Component {
  render() {
    let greeting = this.context;
    return <div>{greeting}</div>
  }
}
CompClass.contextType = Ctx

it('works with createClass style components', () => {
  expectTextContent(
    <Ctx.Provider value={"Hello"}>
      <CompClass />
    </Ctx.Provider>
  ).toBe("Hello")
})

it('works with Context.Consumer', () => {
  expectTextContent(
    <Ctx.Provider value={"Hello"}>
      <Ctx.Consumer>
        {value => <div>{value}</div>}
      </Ctx.Consumer>
    </Ctx.Provider>
  ).toBe("Hello")
})
it('stops propagation at the bottom', () => {
  traverseDepthFirst(<div />, ({element}) => expect(element).toBeTruthy())
})
it('can traverse width first', () => {
  const strings = []
  traverseWidthFirst(
    <div>
      <div>
        <span>One</span>
        <span>Two</span>
      </div>
      <span>Three</span>
    </div>,
    element => {
      if (typeof element === "string") {
        strings.push(element)
      }
    } 
  )

  expect(strings.join(" ")).toBe("Three One Two")
})

it('can be used to find an element, stopping the search then', () => {
  let summary = null;

  const DontTouchMe = () => {
    throw new Error('This should not be evaluated')
  }

  traverseWidthFirst(
    <div>
      <div>
        Foo
      </div>
      <div>
        <summary>success</summary>
        <DontTouchMe /> 
      </div>
    </div>,
    element => {
      if (element.type === "summary") {
        summary = element.props.children;
        return true;
      }
    }
  );

  expect(summary).toBe('success')
})

it('flushes initial state changes', () => {
  const Comp = () => {
    const [state, setState] = useState('before');
    if (state !== 'after') {
      setState('after');
    }

    return <div>{state}</div>
  }

  expectTextContent(<Comp />).toBe('after');
})

it('flushes nested state changes', () => {
  const Inner = ({setState}) => {
    setState('after');
    return null;
  }
  const Outer = () => {
    const [state, setState] = useState('before');
    return (
      <div>
        <div>
          <Inner setState={setState} />
          <div>{state}</div>
        </div>
      </div>
    )
  }

  expectTextContent(<Outer />).toBe('after');
})

it('flushes initial state changes: reducers', () => {
  const Comp = () => {
    const [state, dispatcher] = useReducer((s, action) => action, 'before');
    if (state !== 'after') {
      dispatcher('after');
    }

    return <div>{state}</div>
  }

  expectTextContent(<Comp />).toBe('after');
})


it('flushes nested state changes: reducers', () => {
  const Inner = ({setState}) => {
    setState('after');
    return null;
  }
  const Outer = () => {
    const [state, setState] = useReducer((s, action) => action, 'before');
    return (
      <div>
        <div>
          <Inner setState={setState} />
          <div>{state}</div>
        </div>
      </div>
    )
  }

  expectTextContent(<Outer />).toBe('after');
})

it('warns against ignored hooks... but only once', () => {
  global.console.warn = jest.fn();
  const Comp = () => {
    React.useEffect();
    React.useImperativeHandle();
    React.useLayoutEffect();
    React.useDebugValue();
    return <div>done</div>
  }

  expectTextContent(<><Comp /><Comp /><Comp /></>).toBe('done done done');
  expect(global.console.warn).toHaveBeenCalledWith('WARNING: use of useEffect is not supported for static traversal, and its effects will be ignored.')
  expect(global.console.warn).toHaveBeenCalledWith('WARNING: use of useImperativeHandle is not supported for static traversal, and its effects will be ignored.')
  expect(global.console.warn).toHaveBeenCalledWith('WARNING: use of useLayoutEffect is not supported for static traversal, and its effects will be ignored.')
  expect(global.console.warn).toHaveBeenCalledWith('WARNING: use of useDebugValue is not supported for static traversal, and its effects will be ignored.')
  
  expect(global.console.warn).toHaveBeenCalledTimes(4);

})

it('flushes initial state changes on class types', () => {
  class Comp extends React.Component {
    constructor() {
      super()
      this.state = {val: 'before'}
    }

    update() {
      this.setState({val: 'after'})
    }

    render() {
      if (this.state.val !== 'after') {
        this.update();
    }
      return <div>{this.state.val}</div>
    }
  }

  expectTextContent(<Comp />).toBe('after')
})

it('flushes nested state changes on class types', () => {
  const Inner = ({update}) => {
    update();
    return <span>inner</span>;
  }
  
  class Comp extends React.Component {
    constructor() {
      super()
      this.state = {val: 'before'}
    }

    update() {
      if (this.state.val !== 'after') {
        this.setState({val: 'after'})
      }
    }

    render() {
      return <div><Inner update={() => this.update()} />{this.state.val}</div>
    }
  }

  expectTextContent(<Comp />).toBe('inner after')
})

it('actions forceUpdate() calls', () => {
  class Comp extends React.Component {
    constructor() {
      super()
      this.state = {val: 'before'}
    }

    update() {
      if (this.state.val !== 'after') {
        this.state = {val: 'after'}
        this.forceUpdate();
      }
    }

    render() {
      const inner = <div>{this.state.val}</div>
      this.update();
      return inner;
    }
  }

  expectTextContent(<Comp />).toBe('after')
})

it('calls lifecycle functions', () => {
  const call = jest.fn()
  const dontCall = jest.fn();

  class Comp extends React.Component {
    constructor() {
      super()
    }

    componentWillMount() {
      call();
    }

    UNSAFE_componentWillMount() {
      call();
    }

    componentDidMount() {
      dontCall();
    }

    render() {
      return <div>done</div>
    }
  }

  expectTextContent(<Comp />).toBe('done');
  expect(call).toHaveBeenCalledTimes(2);
  expect(dontCall).not.toHaveBeenCalled();
})

it('warns against shouldComponentUpdate being ignored... but only once', () => {
  global.console.warn = jest.fn();
  class Comp extends React.Component {
    constructor() {
      super()
    }

    shouldComponentUpdate() {
      return true;
    }

    render() {
      return <div>done</div>
    }
  }

  expectTextContent(<><Comp /><Comp /><Comp /></>).toBe('done done done');
  expect(global.console.warn).toHaveBeenCalledTimes(1)
  expect(global.console.warn).toHaveBeenCalledWith('WARNING: use of shouldComponentUpdate is not supported for static traversal, and its effects will be ignored.')
})

it('supports lazy eval of children', () => {
  const Boom = () => {
    throw "boom!"
  }

  const element = (
    <>
      <div className='danger'><Boom /></div>
      <div>success</div>
    </>
  )

  const res = traverseDepthFirst(element, 
    ({element, unbox}) => {
      if(element.props.className === 'danger') {
        return '';
      }
      const array = unbox();
      return flatten({array})
    });

  expect(res).toBe('success');
})

it('supports custom eval of children', () => {
  const Hidden = ({children}) => {
    return null;
  }

  const element = (
    <Hidden>
      <span>success</span>
    </Hidden>
  )

  const res = traverseDepthFirst(element, 
    ({element, unbox}) => {
      if(element.type === Hidden) {
        return flatten({array: unbox(element.props.children)});
      }
      const array = unbox();
      return flatten({array})
    });

  expect(res).toBe('success');
})

it('passes through a context getter', () => {
  const Ctx = React.createContext();

  const element = (
    <Ctx.Provider value={'success'}>
      <span>before</span>
    </Ctx.Provider>
  )

  const res = traverseDepthFirst(element, ({element, unbox, getContext}) => {
    if (element.type === 'span') {
      return getContext(Ctx);
    } else {
      return unbox().join("")
    }
  });

  expect(res).toBe('success')
})