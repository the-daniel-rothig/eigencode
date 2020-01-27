import React, { useContext } from 'react';
import GroupContext from './GroupContext';

export const getFullName = (groupContext, name) => {
  if (!groupContext || !groupContext.name) {
    return name || '';
  }

  if (!name) {
    return groupContext.name;
  }

  if (groupContext.prefix && name[0] === "[") {
    throw new Error("Array entries cannot be placed in Groups in prefix mode");
  }

  if (name[0] === "[") {
    return groupContext.name + name;
  }

  if (groupContext.prefix) {
    return `${groupContext.name}${name[0].toUpperCase()}${name.substring(1)}`;
  }

  return `${groupContext.name}.${name}`;
}

export default  ({name, prefix, children}) => {
  
  const outer = useContext(GroupContext);
  const fullName = getFullName(outer, name)

  return (
    <GroupContext.Provider value={{name: fullName, prefix}}>
      {children}
    </GroupContext.Provider>
  )
};