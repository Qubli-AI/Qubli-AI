import { createContext, useContext } from "react";

const SidebarContext = createContext({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default SidebarContext;
