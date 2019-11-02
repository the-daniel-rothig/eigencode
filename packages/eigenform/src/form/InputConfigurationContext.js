import { createContext } from 'react';

export default createContext(null, (prev, next) => prev.inputs.length !== next.inputs.length ? 3 : 1);