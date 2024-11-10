import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import useSocket from "../hooks/useSocket";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  useSocket();
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const socketRef = useRef();
  const [loader, setLoader] = useState(true);

  // Function to handle room redirection
  const handleRedirect = () => {
    router.push(`/calling/${roomName || Math.random().toString(36).slice(2)}`);
  };

  // Function to get and set the UUID cookie
  function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  }

  // Function to set the UUID cookie
  function setUUIDCookie() {
    document.cookie =
      "token_id=" +
      uuidv4() +
      "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
  }

  // Function to get the UUID cookie
  function getUUIDCookie() {
    var name = "token_id=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(";");
    for (var i = 0; i < cookieArray.length; i++) {
      var cookie = cookieArray[i];
      while (cookie.charAt(0) == " ") {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) == 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };
  console.log("new code added123");
  // UseEffect to manage socket connection
  useEffect(() => {
    const connectSocket = () => {
      setLoader(false);
      const existingUUID = getUUIDCookie();
      if (!existingUUID) {
        setUUIDCookie();
      }
      socketRef.current = io(process.env.NEXT_PUBLIC_LIVE_URL);

      socketRef.current.on("getWaitingRooms", (rooms) => {
        console.log("getWaitingRooms", rooms);

        let selectedRoom = null;

        // Loop through the waiting queue to find an available room with less than 2 users
        for (let i = rooms.waiting_queue.length - 1; i >= 0; i--) {
          const room = rooms.waiting_queue[i];
          if (rooms.active_sessions_users[room]?.length < 2) {
            selectedRoom = room;
            break;
          }
        }

        // If no room is found, create a new one
        setRoomName(selectedRoom || uuidv4());
      });
    };

    connectSocket();

    // Cleanup the socket connection when the component unmounts
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // UseEffect to check user’s preferred theme
  useEffect(() => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkTheme(prefersDarkMode);
  }, []);

  useEffect(() => {
    socketRef.current.emit("leave_on");
  }, []);

  return (
    <>
      <main className={`min-h-screen ${inter.className}`}>
        {loader && <div id="loader" className="loader"></div>}
        <div className="">
          <div className="main-content-text">
            <h1 className="main-hd">Smart AI Conversations</h1>
            <p className="sub-hd mb-[30px]">
              Your Ultimate Virtual Chat Assistant Experience
            </p>
            <button
              onClick={openModal}
              className="btn bg-[#031E29] text-white dark:bg-white dark:text-[#000]">
              <span className="flex justify-center items-center gap-2">
                <img className="dark:hidden block" src="./mic_svgrepo.png" />
                <img
                  className="dark:block hidden"
                  src="./mic_svgrepo-dark.png"
                />
                Start Call
              </span>
            </button>
          </div>
        </div>
        {isModalOpen && (
          <div className="modal ">
            <div className="modal-content bg-[#031E29] text-white dark:bg-[#fff] dark:text-[#031E29] text-center">
              <p className="text-[32px] mb-[40px]">Are you 18+</p>
              <div>
                <button
                  onClick={handleRedirect}
                  className="m-2 btn dark:bg-[#031E29] dark:text-white bg-white text-[#000]">
                  Yes
                </button>
                <button
                  onClick={closeModal}
                  className="m-2 btn dark:bg-[#031E29] dark:text-white bg-white text-[#000]">
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
