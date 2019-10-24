export default ({array, element}) => {
  if (!element || !element.type) {
    return {
      value: element || "",
      wantsSpacing: false
    }
  }
  const wantsSpacing = typeof element.type === "string" &&
     !["span", "em", "strong", "b", "small", "u", "a", "abbr", "acronym", "big", "q", "s", "sub", "sup", "time"].includes(element.type);

  const saneArray = array.filter(x => x !== null && x !== undefined).map(x => typeof x === "object" ? x : {
    value: `${x}`,
    wantsSpacing: false
  });

  if (saneArray.length === 0) {
    return {
      value: "",
      wantsSpacing: wantsSpacing
    }
  }

  const res = [];

  for (var i = 0; i<saneArray.length; i++) {
    if (saneArray[i].value === "") {
      continue;
    }
    res.push(saneArray[i].value)

    const shouldAddSpace = i !== saneArray.length - 1 && // there is a next sibling
      (saneArray[i].wantsSpacing || saneArray[i+1].wantsSpacing) && // and one of us wants spacing
      !/\s$/.test(saneArray[i].value) && // and I have no space at the end
      !/^\s/.test(saneArray[i+1].value); // and the sibling has no space at the start

    if (shouldAddSpace) {
      res.push("\n")
    }
  }

  return {
    value: res.join(""),
    wantsSpacing: wantsSpacing,
  }
}