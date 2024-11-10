import React, { useState, useEffect } from "react";
import Link from 'next/link'

export const Sidebar = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for the current mode
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    // Update local storage and body class when darkMode changes
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  const handleToggle = () => {
    setDarkMode(!darkMode);
  };
  // const [dark, setDark] = useState(false);

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const savedDarkMode = localStorage.getItem("darkMode");
  //     if (savedDarkMode !== null) {
  //       setDark(JSON.parse(savedDarkMode));
  //     }
  //   }
  // }, []);

  // useEffect(() => {
  //   if (dark) {
  //     document.body.classList.add("dark");
  //   } else {
  //     document.body.classList.remove("dark");
  //   }
  // }, [dark]);

  // const darkModeHandler = () => {
  //   setDark((prevDark) => {
  //     const newDark = !prevDark;
  //     if (typeof window !== "undefined") {
  //       localStorage.setItem("darkMode", JSON.stringify(newDark));
  //     }
  //     return newDark;
  //   });
  // };
  const [isToggled, setIsToggled] = useState(false);

  const handleClick = () => {
    setIsToggled((prevState) => !prevState);
  };

  return (
    <>
      <header className="bg-[#fafafa] dark:bg-[#031E29]">
        <div className="mx-auto">
          <nav className="">
            <div className="flex flex-wrap items-center justify-between mx-auto p-4">
              <Link
                href="/"
                className="logo-icon flex items-center space-x-3 rtl:space-x-reverse"
              >
                <img
                  src="../swift-call-dark-logo.svg"
                  className="dark:hidden h-8"
                  alt=" Logo"
                />
                <img
                  src="../swift-call-light-logo.svg"
                  className="hidden dark:block h-8"
                  alt="Logo"
                />
              </Link>
              <button
                onClick={handleClick}
                className="sidebar-btn inline-flex items-center justify-center w-10 h-10 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              >
                <img className="dark:hidden block" src="../navbar-dark.svg" />
                <img className="hidden dark:block" src="../navbar-light.svg" />
              </button>
              <div
                className={
                  isToggled
                    ? "sidebar show-sidebar w-full"
                    : "sidebar hide-sidebar w-full"
                }
              >
                <div className="menu-list">
                  <button onClick={handleClick} className="ml-auto p-[15px]">
                    <img
                      className="dark:hidden block"
                      src="../close-circle.svg"
                    />
                    <img
                      className="hidden dark:block"
                      src="../close-circle-dark-mode.png"
                    />
                  </button>
                  <ul className="flex flex-col font-medium mt-4 p-[15px]">
                    <li>
                      <a
                        href="#"
                        className="block py-2 px-3 text-black-100 dark:text-white"
                        aria-current="page"
                      >
                        Home
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block py-2 px-3 text-black-100 dark:text-white "
                      >
                        About Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block py-2 px-3 text-black-100 dark:text-white"
                      >
                        Contact Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block py-2 px-3 text-black-100 dark:text-white"
                      >
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block py-2 px-3 text-black-100 dark:text-white"
                      >
                        Terms & Services
                      </a>
                    </li>
                  </ul>

                  <div className="bootom-menu">
                    <div className="text-center">
                      <p className="text-center p-[15px]">
                        <a
                          href="mailto:Support@swiftcall.com"
                          className="text-black-100 font-medium dark:text-white"
                        >
                          Support@swiftcall.com
                        </a>
                      </p>
                      <hr />
                      <div
                        className="mt-[50px] mb-[50px] toggle-container ml-auto mr-auto"
                        onClick={handleToggle}
                      >
                        <span className="toggle-text">
                          {darkMode ? "DARK MODE" : "LIGHT MODE"}
                        </span>
                        <div
                          className={`toggle-circle ${
                            darkMode ? "dark-button" : ""
                          }`}
                        >
                          {" "}
                          <img className="dark:hidden block" src="../sun.svg" />
                          <img
                            className="hidden dark:block"
                            src="../moon.svg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};
