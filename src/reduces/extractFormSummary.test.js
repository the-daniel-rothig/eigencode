import React from 'react'; 
import extractFormSummary from "./extractFormSummary"
import Field from "../form/Field"
import Label from "../form/Label";
import TextInput from "../form/TextInput";
import { traverseDepthFirst } from '../util/reactTraversal';
import Radio from '../form/Radio';
import Select from '../form/Select';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';
import extractText from './extractText';
import ReducerFunction from './ReducerFunction';

const findWithin = (
  selector, 
  andThenReduce = ({element}) => element
) => ReducerFunction.single(
  ({element, isLeaf, unbox}) => {
    if (!isLeaf && selector(element)) {
      const reduced = unbox(element, andThenReduce); 
      return reduced;
    }
    return unbox();
  }
);

const getSectionHeading = ({isSection, isHeading}) => ReducerFunction.single(
  ({element, isRoot, unbox}) => {
    if (isRoot && isSection(element)) {
      const h1 = unbox(element, findWithin(isHeading, extractText))
      return h1 || "";
    }
    return unbox();
  }
);


const getFormSummary = async (element, values, identifySection) => {
  return await traverseDepthFirst(element, extractFormSummary(values, identifySection))
}

describe('extractFormSummary', () => {
  it('gets the Field label', async () => {
    const res = await getFormSummary(  
    <Field name="your first name">
      <Label>Enter your first name</Label>
    </Field>, 
    {firstName: 'Daniel'});

    expect(res).toStrictEqual([{
        type: 'field',
        label: 'Enter your first name',
        name: 'your first name',
        value: 'Daniel'
      }])
  })

  it('gets options from radios', async() => {
    const res = await getFormSummary(      
    <Field name="your preferred animal">
      <Label>Cats or dogs?</Label>
      <Radio value='cats'>Cats!</Radio>
      <Radio value='dogs'>Dogs!!</Radio>
    </Field>, 
    {preferredAnimal: 'dogs'});

    expect(res).toStrictEqual([{
      type: 'field',
      label: 'Cats or dogs?',
      name: 'your preferred animal',
      value: 'Dogs!!',
      options: [
        {
          type: 'option',
          label: 'Cats!',
          value: 'cats'
        },
        {
          type: 'option',
          label: 'Dogs!!',
          value: 'dogs'
        }
      ]
    }])
  })

  it('gets options from select', async() => {
    const res = await getFormSummary (
      <Field name="your preferred animal">
        <Label>Cats or dogs?</Label>
        <Select options={[
          {label: 'Cats!', value: 'cats'},
          {label: 'Dogs!!', value: 'dogs'}
        ]} />
      </Field>,
      {preferredAnimal: 'dogs'}
    );

    expect(res).toStrictEqual([{
      type: 'field',
      label: 'Cats or dogs?',
      name: 'your preferred animal',
      value: 'Dogs!!',
      options: [
        {
          type: 'option',
          label: 'Cats!',
          value: 'cats'
        },
        {
          type: 'option',
          label: 'Dogs!!',
          value: 'dogs'
        }
      ]
    }])
  })

  it('understands nested fields', async () => {
    const res = await getFormSummary(
      <Field name='your full name'>
        <Label>Please state your name as it appears on your passport</Label>
        <Field name='your first name'>
          <Label>Tell us your first name</Label>
          <TextInput /> 
        </Field>
        <Field name='your last name'>
          <Label>Tell us your last name</Label>
          <TextInput />
        </Field>
      </Field>,
      {fullName: {firstName: 'Daniel', lastName: 'Rothig'}}
    )

    expect(res).toStrictEqual([
      {
        type: 'group',
        label: 'Please state your name as it appears on your passport',
        name: 'your full name',
        fields: [
          {
            type: 'field',
            label: 'Tell us your first name',
            name: 'your first name',
            value: 'Daniel'
          },
          {
            type: 'field',
            label: 'Tell us your last name',
            name: 'your last name',
            value: 'Rothig',
          }
        ]
      }
    ])
  })

  it('gives field information for conditionals even if the condition is not met', async () => {
    const res = await getFormSummary(
      <>
        <Field name='your name'><TextInput /></Field>
        <Conditional when='name' is='Krizia'>
          <Field name='your favourite dog breed'>
            <Label>What is your favourite dog breed?</Label>
            <TextInput />
          </Field>
        </Conditional>
      </>,
      {name: 'Daniel'});

    expect(res).toStrictEqual([
      {
        type: 'field',
        label: undefined,
        name: 'your name',
        value: 'Daniel'
      },
      {
        type: 'field',
        label: 'What is your favourite dog breed?',
        name: 'your favourite dog breed',
        concealed: true
      }
    ])
  })

  it('supports Multiple', async () => {
    const res = await getFormSummary(
      <Multiple name='favourite pets'>
        <Field name='the sort of animal' />
        <Field name='the name of your pet' />
      </Multiple>,
      {favouritePets: [
        {sortOfAnimal: 'black dog', nameOfYourPet: 'Muffin'},
        {sortOfAnimal: 'white dog', nameOfYourPet: 'Cloud'},
      ]}
    )

    expect(res).toStrictEqual([
      {
        type: 'multiple',
        name: 'favourite pets',
        entries: [
          [
            {
              type: 'field',
              label: undefined,
              name: 'the sort of animal',
              value: 'black dog'
            },
            {
              type: 'field',
              label: undefined,
              name: 'the name of your pet',
              value: 'Muffin'
            },
          ],
          [
            {
              type: 'field',
              label: undefined,
              name: 'the sort of animal',
              value: 'white dog'
            },
            {
              type: 'field',
              label: undefined,
              name: 'the name of your pet',
              value: 'Cloud'
            },
          ],
        ]
      }
    ])
  })

  it('lets you group by sections', async () => {
    const res = await getFormSummary(
      <div>
        <div className="section">
          <h1>section one</h1>
          <Field name='the first field' />
          <Field name='the second field' />
        </div>
        <div className="section">
          <h2>section two</h2> {/* this is a h2 and shouldn't be matched - but the section should! */}
          <Field name='the third field' />
        </div>
      </div>,
      {},
      getSectionHeading({
        isSection: element => element.type === "div" && element.props.className === "section",
        isHeading:  element => element.type === "h1"
      })
    );
    

    expect(res).toStrictEqual([
      {
        type: 'section',
        label: 'section one',
        contents: [
          {
            type: 'field',
            name: 'the first field',
            label: undefined
          },
          {
            type: 'field',
            name: 'the second field',
            label: undefined
          }
        ]
      }, 
      {
        type: 'section',
        label: '',
        contents: [
          {
            type: 'field',
            name: 'the third field',
            label: undefined
          }
        ]
      },
    ])
  })
})