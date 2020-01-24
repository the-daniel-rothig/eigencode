import React from 'react';
import withInlineProps from './withInlineProps';
import { render } from '@testing-library/react';

const Wrapped = ({children, args}) => {
  const saneArgs = 
    Array.isArray(args) ? args :
    args !== undefined ? [ args ] :
    [];
  
  return children(...saneArgs);
};

const [ Inline, { value, val2 } ] = withInlineProps('value', 'val2')(Wrapped);

it('swaps out a single inline prop', () => {
  const { getByText } = render(
    <Inline args="Hello World">
      {value}
    </Inline>
  )

  expect(getByText("Hello World")).toBeTruthy();
})

it('drills into other elements', () => {
  const FancyWidget = ({children}) => <span className="fancy">{children}</span>;

  const { getByText } = render(
    <Inline args="World">
      <FancyWidget>
        Hello {value}
      </FancyWidget>
    </Inline>
  )

  expect(getByText("Hello World")).toBeTruthy();
})

it('supports multiple vals', () => {
  const { getByText } = render(
    <Inline args={["Hello", "World"]}>
      {value} {val2}
    </Inline>
  )

  expect(getByText("Hello World")).toBeTruthy();
})

it('works on non-children props', () => {
  const { getByTestId } = render(
    <Inline args="world">
      <span data-testid={value}>test</span>
    </Inline>
  );

  expect(getByTestId('world')).toBeTruthy();
})

it('works on non-children elements', () => {
  const Childless = ({nephews}) => <div>{nephews}</div>;
  const { getByText } = render(
    <Inline args="hello world">
      <Childless nephews={(
        <span>
          {value}
        </span>
      )} />
    </Inline>
  );

  expect(getByText('hello world')).toBeTruthy();
})

it('works when nested', () => {
  const { getByText } = render(
    <Inline args="outer">
      <span>outer={value}</span>
      <Inline args="inner">
        <span>inner={value}</span>
      </Inline>
    </Inline>
  );

  expect(getByText("outer=outer")).toBeTruthy()
  expect(getByText("inner=inner")).toBeTruthy()
})

it('respects maps', () => {
  const { getByText } = render(
    <Inline args="loud">
      <span>{value.map(x => x + "er")}</span>
    </Inline>
  )

  expect(getByText("louder")).toBeTruthy();
})

it('respects chains of maps', () => {
  const veryLoud = value
    .map(x => x + "est")
    .map(x => x.toUpperCase());

  const { getByText } = render(
    <Inline args="loud">
      <span>{veryLoud}</span>
    </Inline>
  )

  expect(getByText("LOUDEST")).toBeTruthy();
})

it('escapes nesting with markers', () => {
  const { getByText } = render(
    <Inline args="One" propId="levelOne">
      <Inline args="Two" propId="levelTwo">
        <Inline args="Three">
          <span>
            {value}
            {value.from("levelTwo")}
            {value.from("levelOne")}
          </span>
        </Inline>
      </Inline>
    </Inline>
  );

  expect(getByText("ThreeTwoOne")).toBeTruthy();
})

it('ignores unmatched markers: unnamed component', () => {
  const { getByText } = render(
    <Inline args="not ">
      <span>This does {value.from('notfound')}work.</span>
    </Inline>
  )

  expect(getByText("This does work.")).toBeTruthy();
})

it('ignores unmatched markers: named component', () => {
  const { getByText } = render(
    <Inline args="not " propId="found">
      <span>This does {value.from('notfound')}work.</span>
    </Inline>
  )

  expect(getByText("This does work.")).toBeTruthy();
})

it('keeps .from() optional even if component has a propId', () => {
  const { getByText } = render(
    <Inline args="success" propId="found">
      <span>{value}</span>
    </Inline>
  )

  expect(getByText("success")).toBeTruthy();
})

it('allows propId markers to be overwritten', () => {
  const { getByText } = render(
    <Inline args="success" propId="found">
      <span>{value.from('notfound').from('found')}</span>
    </Inline>
  )

  expect(getByText("success")).toBeTruthy();
})

it('allows propId markers to be reset', () => {
  const { getByText } = render(
    <Inline args="success">
      <span>{value.from('notfound').from()}</span>
    </Inline>
  )

  expect(getByText("success")).toBeTruthy();
})

it('can instrument props other than children', () => {

  const LayoutRenderProps = ({header, children, footer}) => (
    <div>
      <div className="header">
        {header("Signed-out user")}
      </div>
      <div>
        {children(10, 5)}
      </div>
      <div className="footer">
        {footer("1998")}
      </div>
    </div> 
  );

  const [Layout, {header, children, footer}] = withInlineProps({
    header: 'userName',
    children: ['totalCount', 'unreadCount'],
    footer: 'copyright'
  })(LayoutRenderProps);

  const { getByText } = render(
    <Layout
      header={<>Welcome, {header.userName}</>}
      footer={<>Copyright {footer.copyright}</>}
    >
      There are {children.totalCount} blog posts, of which {children.unreadCount} are unread.
    </Layout>
  )

  expect(getByText("Welcome, Signed-out user")).toBeTruthy();
  expect(getByText("Copyright 1998")).toBeTruthy();
  expect(getByText("There are 10 blog posts, of which 5 are unread.")).toBeTruthy();
})

it('can wrap context consumers', () => {
  const { Provider, Consumer } = React.createContext();

  const [ Ctx, {ctx} ] = withInlineProps('ctx')(Consumer);

  const { getByText } = render(
    <Provider value="outer">
      <Ctx>
        <span>This reads outer: {ctx}</span>
        <Provider value="inner">
          <span>This also reads outer: {ctx}</span>
          <Ctx>
            <span>This reads inner: {ctx}</span>
          </Ctx>
        </Provider>
      </Ctx>
    </Provider>
  );

  expect(getByText("This reads outer: outer")).toBeTruthy();
  expect(getByText("This also reads outer: outer")).toBeTruthy();
  expect(getByText("This reads inner: inner")).toBeTruthy();
})