import React from 'react';
import { render } from "@testing-library/react";

import withInlineProps from "./withInlineProps";
import { combine } from './combiner';

const [WordProvider, {word, word2}] = withInlineProps('word', 'word2')(
  ({word, word2, children}) => children(word, word2)
);

it('combines variables of the same component', () => {
  const joinWords = (w1, w2) => `${w1} ${w2.toUpperCase()}`;

  const { getByText } = render(
    <WordProvider word="Hello" word2="World">
      {combine([word, word2], joinWords)}
    </WordProvider>
  )

  expect(getByText("Hello WORLD")).toBeTruthy();
})

it('combines mapped variables of the same component', () => {
  const joinWords = (w1, w2) => `${w1} ${w2}`;

  const { getByText } = render(
    <WordProvider word="Hello" word2="World">
      {combine([word, word2.map(x => x.toUpperCase())], joinWords)}
    </WordProvider>
  )

  expect(getByText("Hello WORLD")).toBeTruthy();
})

it('combines variables from different scope levels', () => {
  const joinWords = (w1, w2) => `${w1} ${w2}`;

  const { getByText } = render(
    <WordProvider word="Hello" propId="outer">
      <WordProvider word="WORLD">
        {combine([word.from('outer'), word], joinWords)}
      </WordProvider>
    </WordProvider>
  )

  expect(getByText("Hello WORLD")).toBeTruthy();
})

it('combines variables from mixed providers', () => {
  const joinWords = (w1, w2) => `${w1} ${w2}`;

  const [OtherProvider, {word: otherWord}] = withInlineProps('word')(
    ({word, children}) => children(word)
  );

  const { getByText } = render(
    <WordProvider word="Hello">
      <OtherProvider word="WORLD">
        {combine([word, otherWord], joinWords)}
      </OtherProvider>
    </WordProvider>
  ) 
  
  expect(getByText("Hello WORLD")).toBeTruthy();
})

it('exposes a chainable map function', () => {
  const joinWords = (w1, w2) => `${w1} ${w2.toUpperCase()}`;

  const { getByText } = render(
    <WordProvider word="Hello" word2="World">
      {combine([word, word2], joinWords)
        .map(x => x.toUpperCase())
        .map(x => `${x} ${x.toLowerCase()}`)
      }
    </WordProvider>
  )

  expect(getByText("HELLO WORLD hello world")).toBeTruthy();
})

it('is exposed as a method on inline props', () => {
  const joinWords = (w1, w2) => `${w1} ${w2}`;

  const { getByText } = render(
    <WordProvider word="Hello" word2="World">
      {word.combine([word2], joinWords)}
    </WordProvider>
  )
  
  expect(getByText("Hello World")).toBeTruthy();
})

it('accepts a single inline prop in its method form', () => {
  const joinWords = (w1, w2) => `${w1} ${w2}`;

  const { getByText } = render(
    <WordProvider word="Hello" word2="World">
      {word.combine(word2, joinWords)}
    </WordProvider>
  )
  
  expect(getByText("Hello World")).toBeTruthy();
})

it('renders nothing if not all values found', () => {
  
  const joinWords = (w1, w2) => `${w1} ${w2}`;

  const { getByText } = render(
    <WordProvider word="Hello">
      start
      {word.combine(word.from('notfound'), joinWords)}
      end
    </WordProvider>
  )
  
  expect(getByText("startend")).toBeTruthy();
})

it('rejects missing map functions', () => {
  expect(() => word.combine(word)).toThrow(/function/)
})

it('rejects non-prop entries', () => {
  expect(() => word.combine("word", () => {})).toThrow(/inline prop/)
  expect(() => word.combine([null], () => {})).toThrow(/inline prop/)
})

// todo: map/from combination tests