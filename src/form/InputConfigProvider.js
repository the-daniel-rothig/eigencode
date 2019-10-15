import React, {useContext, useRef} from 'react';
import InputConfigurationContext from './InputConfigurationContext';

const InputConfigProvider = ({mapRegister = x=>x, mapDeregister = x=>x, children}) => {
  const outer = useContext(InputConfigurationContext);
  const ref = useRef();

  const register = item => outer.register({ref, ...mapRegister(item)});
  const deregister = item => outer.deregister({ref, ...mapDeregister(item)});

  const localInputs = outer.inputs.filter(x => x.ref === ref);

  return (
    <InputConfigurationContext.Provider value={{inputs: outer.inputs, localInputs, register, deregister}}>
      {children}
    </InputConfigurationContext.Provider>
  );
};

export default InputConfigProvider;