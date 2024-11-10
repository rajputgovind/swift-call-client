import React from "react";
import {Sidebar} from "./Sidebar";
import Footer from "./Footer";
import SocialLink from "./SocialLink";

const Layout = ({ children }) => {
  return (
    <>
      <div className="main-layout-screen bg-[#fafafa] dark:bg-[#031E29]">
        <Sidebar />
        <SocialLink/>
        <main className="main-layout">{children}</main>
        <Footer/>
      </div>
    </>
  );
};

export default Layout;
