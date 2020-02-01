import CustomRenderFunction from "../CustomRenderFunction.withRender";

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
      (array[i].wantsSpacing.end || array[i+1].wantsSpacing.start) && // and one of us wants spacing
      !/\s$/.test(array[i].value) && // and I have no space at the end
      !/^\s/.test(array[i+1].value); // and the sibling has no space at the start

    if (shouldAddSpace) {
      res.push("\n")
    }
  }

  return res.join("");
}

const combineSpacingRequirements = (wantsSpacing, array) => {
  
  return {
    start: wantsSpacing.start || (array.length && array[0].wantsSpacing.start),
    end: wantsSpacing.end || (array.length && array[array.length - 1].wantsSpacing.end)
  };
}

const reduce = ({unbox, element}) => {
  if (!element || !element.type) {  
    return {
      value: element || "",
      wantsSpacing: {start: false, end: false}
    }
  }

  const wantsSpacingFlag = typeof element.type === "string" &&
     !["span", "em", "strong", "b", "small", "u", "a", "abbr", "acronym", "big", "q", "s", "sub", "sup", "time"].includes(element.type);
    
  const wantsSpacing = {start: wantsSpacingFlag, end: wantsSpacingFlag};

  return unbox(subStrings => ({
    value: combinePartialResults(subStrings),
    wantsSpacing: combineSpacingRequirements(wantsSpacing, subStrings),
  }))
}

export default new CustomRenderFunction({
  reduce, 
  finalTransform: combinePartialResults
});