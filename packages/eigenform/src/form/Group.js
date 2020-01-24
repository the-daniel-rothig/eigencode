import React, { useContext } from 'react';
import GroupContext from './GroupContext';

export default  ({name, children}) => {
  const outer = useContext(GroupContext);
  const saneOuter = outer ? outer.name : '';
  const saneName = name || '';
  const connector = saneOuter && saneName && saneName[0] !== "[" ? "." : ""
  const fullName = `${saneOuter}${connector}${saneName}`;

  return (
    <GroupContext.Provider value={{name: fullName}}>
      {children}
    </GroupContext.Provider>
  )
};