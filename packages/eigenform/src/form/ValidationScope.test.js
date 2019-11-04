import React, { useContext } from 'react';
import ValidationScopeContext from './ValidationScopeContext';
import ValidationScope from './ValidationScope';
import Field from './Field';
import { render, cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

const ValidateButton = ({value, cb, name='validate'}) => {
  const { runValidation } = useContext(ValidationScopeContext)
  const onClick = () => cb(runValidation(value))
  return <button type="button" onClick={onClick}>{name}</button> 
}

const ErrorOutput = ({name='errors'}) => {
  const { errors } = useContext(ValidationScopeContext);
  return <pre data-testid={name}>{JSON.stringify(errors, null, ' ')}</pre>
}

const setup = async (assertResult, values, children = null, Wrapper = React.Fragment) => {

  const r = render (
    <Wrapper>
      <ValidationScope>
        {children}
        <ValidateButton value={values} cb={assertResult} />
        <ErrorOutput />
      </ValidationScope>
    </Wrapper>
  )
  await act( () => r.getByText('validate').click() )

  return r;  
}

afterEach(cleanup);

it('makes validation available 1', async done => {
  const { getByTestId } = await setup(assertResult, {foo: ''}, <Field name='foo' />);
  
  async function assertResult(validate) {
    await validate;
    expect(JSON.parse(getByTestId('errors').innerHTML)).toStrictEqual(
      [
        {
          path: 'foo',
          message: 'please enter foo'
        }
      ]
    )
    done();
  };
})

it('makes validation available 2', async done => {
  const { getByTestId } = await setup(assertResult, {foo: 'Daniel'}, <Field name='foo' />)

  async function assertResult(validate) {
    await expect(validate).resolves.toStrictEqual({foo: 'Daniel'})
    expect(getByTestId('errors').innerHTML).toBe('');
    done();
  }
})

it('works wihin a field context', async done => {
  const FieldBar = ({children}) => <Field name='bar'>{children}</Field>
  const { getByTestId } = await setup(assertResult, { bar: {foo: 'Daniel' }}, <Field name='foo' />, FieldBar)

  async function assertResult(validate) {
    await expect(validate).resolves.toStrictEqual({foo: 'Daniel'});
    expect(getByTestId('errors').innerHTML).toBe('');
    done()
  }
})

it('cancels promises when the outer field name changes', () => {
  // todo
})

it('works when nested', async () => {
  const value = {
    inner: 'valid',
    outer: '',
  };

  const { getByText, getByTestId } = render(
    <ValidationScope>
      <ValidationScope>
        <Field name='inner' />
        <ValidateButton value={value} cb={assertResultInner} name='validate inner'/>
        <ErrorOutput name='inner'/>
      </ValidationScope>
      <Field name='outer' />
      <ValidateButton value={value} cb={assertResultOuter} name='validate outer'/>
      <ErrorOutput name='outer' />
    </ValidationScope>
  )
  
  act(async () => getByText('validate inner').click() )
  act(async () => getByText('validate outer').click() )
  
  async function assertResultInner(validate) {
    await expect(validate).resolves.toStrictEqual(value);
    expect(getByTestId('inner').innerHTML).toBe('');
  }

  async function assertResultOuter(validate) {
    await validate;
    expect(JSON.parse(getByTestId('outer').innerHTML)).toStrictEqual(
      [
       {
        "path": "outer",
        "message": "please enter outer"
       }
      ]);
  }

  await new Promise(ok => setTimeout(ok, 10));
})

it('enforces completeness when isComplete is set', async done => {
  const { getByText, getByTestId } = render(
    <ValidationScope isComplete>
      <Field name='foo' />
      <ValidateButton value={{foo: 'foo', bar: 'unknown'}} cb={assertResult} />
      <ErrorOutput />
    </ValidationScope>
  )

  act(() => getByText('validate').click())

  async function assertResult(validate) {
    await validate;
    expect(JSON.parse(getByTestId('errors').innerHTML)).toStrictEqual(
      [
        {
          "message": "this field cannot have keys not specified in the object shape"
        }
      ]
    )
    done()
  }
})
