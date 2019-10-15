import { useContext } from 'react';

export default (...args) => {
  const realConsoleError = console.error;
  console.error = () => {}
  try {
    return useContext(...args);
  } finally {
    console.error = realConsoleError;
  }
}