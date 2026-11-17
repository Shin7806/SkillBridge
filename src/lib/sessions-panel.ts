import { createContext, useContext } from "react";

/** Open state of the right-hand Sessions panel, shared so any page can open it. */
export const SessionsPanelContext = createContext<{ open: boolean; setOpen: (o: boolean) => void; toggle: () => void }>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});
export const useSessionsPanel = () => useContext(SessionsPanelContext);
