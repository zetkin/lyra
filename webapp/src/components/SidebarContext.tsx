'use client';

import { createContext, FC, ReactNode, useCallback, useState } from 'react';

type SidebarContext = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
};

export const SidebarContext = createContext<SidebarContext>({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
});

const SidebarContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, _setIsSidebarOpen] = useState(false);
  const setIsSidebarOpen = useCallback((value: boolean) => {
    if (value) {
      document.documentElement.style.setProperty(
        '--SideNavigation-slideIn',
        '1',
      );
    } else {
      document.documentElement.style.removeProperty('--SideNavigation-slideIn');
    }
    _setIsSidebarOpen(value);
  }, []);
  const value = { isSidebarOpen, setIsSidebarOpen };
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export default SidebarContextProvider;
