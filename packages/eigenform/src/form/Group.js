import React, { useContext } from 'react';
import GroupContext from './GroupContext';

export default ({name, children}) => {
  const outer = useContext(GroupContext);
  const saneOuter = outer ? outer.name : '';
  const saneName = name || '';
  const fullName = `${saneOuter}.${saneName}`;
  return (
    <GroupContext.Provider value={{name: fullName}}>
      {children}
    </GroupContext.Provider>
  )
}