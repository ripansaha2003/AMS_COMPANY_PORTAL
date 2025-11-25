import React, { createContext, useContext, useState } from "react";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [array, setArray] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <LocationContext.Provider value={{ array, setArray, collapsed, setCollapsed }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useArray = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useArray must be used within a LocationProvider");
  }
  return context;
};
