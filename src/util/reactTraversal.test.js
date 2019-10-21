import React, { useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { traverseDepthFirst, traverseWidthFirst } from './reactTraversal';

const Ctx = React.createContext();
  
const flatten = ({array}) => array.filter(Boolean).map(x => x.toString().trim()).filter(Boolean).join(" ");
const expectTextContent = (element) => {
  const res = traverseDepthFirst(element, flatten)
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
    </React.Suspense>,
    ({array}) => array.join("")
  );
  expect(res).toBe("Hello everybody");
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
it('stops propagation at the bootom', () => {
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