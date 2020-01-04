const makeProxy = () => {
  const res = [];
  var p = new Proxy({}, {
    get: (obj, prop) => {
      res.push(prop);
      return undefined;
    }
  });

  return [p, res];
}

export default (fn) => {
  const proxies = [];
  for (var i = 0; i < fn.length; i++) proxies.push(makeProxy());
  
  fn(...proxies.map(x => x[0]));
  return [...proxies.map(x => x[1])];
}