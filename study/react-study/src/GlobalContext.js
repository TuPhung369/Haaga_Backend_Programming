import React, { createContext, useState, useEffect } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [loginSocial, setLoginSocial] = useState(() => {
    const saved = localStorage.getItem("loginSocial");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("loginSocial", loginSocial);
  }, [loginSocial]);

  return (
    <GlobalContext.Provider value={{ loginSocial, setLoginSocial }}>
      {children}
    </GlobalContext.Provider>
  );
};
