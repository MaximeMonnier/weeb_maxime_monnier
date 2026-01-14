import React from "react";
import NavBar from "../components/common/NavBar";

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div>
      <NavBar />
      {children}
    </div>
  );
};

export default MainLayout;
