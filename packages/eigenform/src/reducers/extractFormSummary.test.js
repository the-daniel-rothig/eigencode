import React from 'react'; 
import { textRenderer, CustomRenderFunction } from 'react-custom-renderer';

import extractFormSummary from "./extractFormSummary";

import Field from "../form/Field"
import Label from "../form/Label";
import TextInput from "../form/TextInput";
import Radio from '../form/Radio';
import Select from '../form/Select';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';
import Group from '../form/Group';

const findWithin = (
  selector, 
  andThenReduce = ({element}) => element
) => new CustomRenderFunction({
    reduce: ({element, isLeaf, unbox}) => {
      if (!isLeaf && selector(element)) {
        return unbox(andThenReduce, r => r);
      }
      return unbox();
    },
    finalTransform: x => x[0]
  });

const getSectionHeading = ({isSection, isHeading}) => new CustomRenderFunction({
  reduce: ({element, isRoot, unbox}) => {
    if (isRoot && isSection(element)) {
      return unbox(findWithin(isHeading, textRenderer), h1 => {
        return h1 || "";
      })
    }
    return unbox();
  },
  finalTransform: x => x[0]
});


const getFormSummary = async (element, values, identifySection) => {
  return await extractFormSummary(values, identifySection).render(element)
}

describe('extractFormSummary', () => {
  it('gets the Field label', async () => {
    const res = await getFormSummary(  
    <Field label="your first name">
      <Label>Enter your first name</Label>
    </Field>, 
    {yourFirstName: 'Daniel'});

    expect(res).toStrictEqual([{
        type: 'field',
        label: 'Enter your first name',
        name: 'yourFirstName',
        value: 'Daniel'
      }])
  })

  it('gets options from radios', async() => {
    const res = await getFormSummary(      
    <Field label="your preferred animal">
      <Label>Cats or dogs?</Label>
      <Radio value='cats'>Cats!</Radio>
      <Radio value='dogs'>Dogs!!</Radio>
    </Field>, 
    {yourPreferredAnimal: 'dogs'});

    expect(res).toStrictEqual([{
      type: 'field',
      label: 'Cats or dogs?',
      name: 'yourPreferredAnimal',
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
      <Field label="your preferred animal">
        <Label>Cats or dogs?</Label>
        <Select options={[
          {label: 'Cats!', value: 'cats'},
          {label: 'Dogs!!', value: 'dogs'}
        ]} />
      </Field>,
      {yourPreferredAnimal: 'dogs'}
    );

    expect(res).toStrictEqual([{
      type: 'field',
      label: 'Cats or dogs?',
      name: 'yourPreferredAnimal',
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

  it('understands fields in groups', async () => {
    const res = await getFormSummary(
      <Group label='your full name'>
        <Label>Please state your name as it appears on your passport</Label>
        <Field label='your first name'>
          <Label>Tell us your first name</Label>
          <TextInput /> 
        </Field>
        <Field label='your last name'>
          <Label>Tell us your last name</Label>
          <TextInput />
        </Field>
      </Group>,
      {yourFullName: {yourFirstName: 'Daniel', yourLastName: 'Rothig'}}
    )

    expect(res).toStrictEqual([
      {
        type: 'group',
        label: 'Please state your name as it appears on your passport',
        name: 'yourFullName',
        fields: [
          {
            type: 'field',
            label: 'Tell us your first name',
            name: 'yourFirstName',
            value: 'Daniel'
          },
          {
            type: 'field',
            label: 'Tell us your last name',
            name: 'yourLastName',
            value: 'Rothig',
          }
        ]
      }
    ])
  })

  it('gives field information for conditionals even if the condition is not met', async () => {
    const res = await getFormSummary(
      <>
        <Field label='your name'><TextInput /></Field>
        <Conditional when='name' is='Krizia'>
          <Field label='your favourite dog breed'>
            <Label>What is your favourite dog breed?</Label>
            <TextInput />
          </Field>
        </Conditional>
      </>,
      {yourName: 'Daniel'});

    expect(res).toStrictEqual([
      {
        type: 'field',
        label: undefined,
        name: 'yourName',
        value: 'Daniel'
      },
      {
        type: 'field',
        label: 'What is your favourite dog breed?',
        name: 'yourFavouriteDogBreed',
        concealed: true
      }
    ])
  })

  it('supports Multiple', async () => {
    const res = await getFormSummary(
      <Multiple label='favourite pets'>
        <Field label='the sort of animal' />
        <Field label='the name of your pet' />
      </Multiple>,
      {favouritePets: [
        {theSortOfAnimal: 'black dog', theNameOfYourPet: 'Muffin'},
        {theSortOfAnimal: 'white dog', theNameOfYourPet: 'Cloud'},
      ]}
    )

    expect(res).toStrictEqual([
      {
        type: 'multiple',
        name: 'favouritePets',
        entries: [
          [
            {
              type: 'field',
              label: undefined,
              name: 'theSortOfAnimal',
              value: 'black dog'
            },
            {
              type: 'field',
              label: undefined,
              name: 'theNameOfYourPet',
              value: 'Muffin'
            },
          ],
          [
            {
              type: 'field',
              label: undefined,
              name: 'theSortOfAnimal',
              value: 'white dog'
            },
            {
              type: 'field',
              label: undefined,
              name: 'theNameOfYourPet',
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
          <Field label='the first field' />
          <Field label='the second field' />
        </div>
        <div className="section">
          <h2>section two</h2> {/* this is a h2 and shouldn't be matched - but the section should! */}
          <Field label='the third field' />
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
            name: 'theFirstField',
            label: undefined
          },
          {
            type: 'field',
            name: 'theSecondField',
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
            name: 'theThirdField',
            label: undefined
          }
        ]
      },
    ])
  })
})