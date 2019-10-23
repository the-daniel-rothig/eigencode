import React, {useContext, useRef} from 'react';
import InputConfigurationContext from './InputConfigurationContext';
import makeUid from '../util/makeUid';

const InputConfigProvider = ({mapRegister = x=>x, mapDeregister = x=>x, children}) => {
  const outer = useContext(InputConfigurationContext);
  const ref = useRef(makeUid()).current;
  
  const register = item => outer ? outer.register({ref, ...mapRegister(item)}) : () => {};
  const deregister = item => outer ? outer.deregister({ref, ...mapDeregister(item)}) : () => {};

  const localInputs = outer && outer.inputs && outer.inputs.filter(x => x.ref === ref) || [];
  const inputs = outer && outer.inputs || []

  return (
    <InputConfigurationContext.Provider value={{inputs, localInputs, register, deregister}}>
      {children}
    </InputConfigurationContext.Provider>
  );
};

export default InputConfigProvider;