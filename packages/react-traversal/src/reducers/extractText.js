import ReducerFunction from "../ReducerFunction";

const combinePartialResults = (array) => {
  if (array.length === 0) {
    return "";
  }

  const res = [];

  for (var i = 0; i<array.length; i++) {
    if (array[i].value === "") {
      continue;
    }
    res.push(array[i].value)

    const shouldAddSpace = i !== array.length - 1 && // there is a next sibling
      (array[i].wantsSpacing || array[i+1].wantsSpacing) && // and one of us wants spacing
      !/\s$/.test(array[i].value) && // and I have no space at the end
      !/^\s/.test(array[i+1].value); // and the sibling has no space at the start

    if (shouldAddSpace) {
      res.push("\n")
    }
  }
  
  return res.join("");
}

const reduce = ({unbox, element}) => {
  if (!element || !element.type) {  
    return {
      value: element || "",
      wantsSpacing: false
    }
  }

  const wantsSpacing = typeof element.type === "string" &&
     !["span", "em", "strong", "b", "small", "u", "a", "abbr", "acronym", "big", "q", "s", "sub", "sup", "time"].includes(element.type);

  return unbox(subStrings => ({
    value: combinePartialResults(subStrings),
    wantsSpacing: wantsSpacing,
  }))
}

export default new ReducerFunction(reduce, undefined, undefined, combinePartialResults);