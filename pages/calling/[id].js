import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import useSocket from "../../hooks/useSocket";
import { useMedia } from "@/providers/MediaProvider"; // Assuming this provides microphone and video stream

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

const Calling = () => {
  const router = useRouter();
  const socketRef = useRef();
  const userStreamRef = useRef();
  const hostRef = useRef(false);
  const userVideoRef = useRef();
  const peerVideoRef = useRef();
  const rtcConnectionRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [roomName, setRoomName] = useState(router.query.id);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Searching...");
  const [waitingRooms, setWaitingRooms] = useState([]);
  const [skippedSessions, setSkippedSessions] = useState([]);
  const [renderForce, setRenderForce] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const intervalRef = useRef(null);

  const { audioStreamRef } = useMedia();

  useEffect(() => {
    setRoomName(router.query.id);
  }, [router.query]);

  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  useEffect(() => {
    if (!roomName) return;

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_LIVE_URL, {
      transports: ["websocket"],
      upgrade: false,
    });

    socketRef.current.on("clear_messages", () => {
      setMessages([]);
    });

    // Get waiting rooms and active sessions
    socketRef.current.on("getWaitingRooms", (rooms) => {
      console.log("getWaitingRooms", rooms);
      setWaitingRooms(rooms.waiting_queue);
      if (
        rooms.active_sessions_users[roomName] &&
        rooms.active_sessions_users[roomName].length === 2
      ) {
        setConnectionStatus("Connected");
      } else {
        setConnectionStatus("Searching...");
      }
    });

    // Join the room
    socketRef.current.emit("join", { roomId: roomName });

    // Room Events
    socketRef.current.on("joined", handleRoomJoined);
    socketRef.current.on("created", handleRoomCreated);
    socketRef.current.on("ready", initiateCall);
    socketRef.current.on("leave", onPeerLeave);
    socketRef.current.on("full", handleRoomFull);
    socketRef.current.on("message_recieved", message_received);
    socketRef.current.on("offer", handleReceivedOffer);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ice-candidate", handlerNewIceCandidateMsg);
    socketRef.current.on("skipped_users", updateSkippedUsers);

    return () => {
      // Cleanup socket connection when leaving
      socketRef.current.emit("skip", roomName);
      socketRef.current.disconnect();
    };
  }, [roomName, renderForce]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (connectionStatus === "Connected" && callStartTime) {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(
          2,
          "0"
        );
        const seconds = String(elapsed % 60).padStart(2, "0");
        setCallDuration(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [connectionStatus, callStartTime]);

  useEffect(() => {
    if (connectionStatus === "Connected") {
      setCallStartTime(Date.now());
    } else {
      setCallDuration("00:00:00"); // Reset the timer
      setCallStartTime(null);
    }
  }, [connectionStatus]);

  const handleRoomJoined = () => {
    if (audioStreamRef.current) {
      userStreamRef.current = audioStreamRef.current;
      userVideoRef.current.srcObject = userStreamRef.current;
      userVideoRef.current.onloadedmetadata = () => {
        userVideoRef.current.play();
      };
      socketRef.current.emit("ready", roomName);
    } else {
      console.error("Microphone access not granted");
    }
  };

  const handleRoomCreated = () => {
    hostRef.current = true;
    if (audioStreamRef.current) {
      userStreamRef.current = audioStreamRef.current;
      userVideoRef.current.srcObject = userStreamRef.current;
      userVideoRef.current.onloadedmetadata = () => {
        userVideoRef.current.play();
      };
    } else {
      console.error("Microphone access not granted");
    }
  };

  const initiateCall = () => {
    console.log("i am init calling...");
    if (hostRef.current && userStreamRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[0],
        userStreamRef.current
      );
      rtcConnectionRef.current
        .createOffer()
        .then((offer) => {
          rtcConnectionRef.current.setLocalDescription(offer);
          socketRef.current.emit("offer", offer, roomName);
        })
        .catch((error) => console.log("Error creating offer:", error));
    }
  };

  const onPeerLeave = ({
    waiting_queue,
    active_sessions_users,
    roomName: roomName2,
  }) => {
    if (active_sessions_users[roomName]?.length == 0 || roomName != roomName2)
      return;

    let waitingRoomsTemp = [...waiting_queue].filter((rn) => rn !== roomName);

    if (waitingRoomsTemp.length !== 0) {
      if (peerVideoRef.current.srcObject) {
        peerVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }

      let roomToJoin =
        waitingRoomsTemp[Math.floor(Math.random() * waitingRoomsTemp.length)];

      if (rtcConnectionRef.current) {
        rtcConnectionRef.current.close();
        rtcConnectionRef.current = null;
      }
      router.push(`/calling/${roomToJoin}`);
    } else {
      hostRef.current = false;
      setConnectionStatus("Searching...");
      socketRef.current.emit("join", { roomId: roomName, userskip: true });
    }
  };

  const message_received = (message) => {
    setMessages(message);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([
        ...messages,
        { message: inputMessage, sender: socketRef.current.id },
      ]);
      socketRef.current.emit("message_send", {
        roomName,
        message: inputMessage,
      });
      setInputMessage("");
    }
  };

  const createPeerConnection = () => {
    const connection = new RTCPeerConnection(ICE_SERVERS);
    connection.onicecandidate = handleICECandidateEvent;
    connection.ontrack = handleTrackEvent;
    return connection;
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      socketRef.current.emit("ice-candidate", event.candidate, roomName);
    }
  };

  const handleTrackEvent = (event) => {
    console.log("event stream", event.streams[0]);
    peerVideoRef.current.srcObject = event.streams[0];
  };

  const handleReceivedOffer = (offer) => {
    // !hostRef.current
    if (true) {
      console.log("i am getting offer");
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[0],
        userStreamRef.current
      );
      rtcConnectionRef.current.setRemoteDescription(offer);
      rtcConnectionRef.current
        .createAnswer()
        .then((answer) => {
          console.log("i am sending answer");
          rtcConnectionRef.current.setLocalDescription(answer);
          socketRef.current.emit("answer", answer, roomName);
        })
        .catch((e) => console.log("getting error", e.message));
    }
  };

  const handleAnswer = (answer) => {
    console.log("i am getting answer...");
    rtcConnectionRef.current.setRemoteDescription(answer).catch(console.log);
  };

  const handlerNewIceCandidateMsg = (incoming) => {
    const candidate = new RTCIceCandidate(incoming);
    rtcConnectionRef.current
      ?.addIceCandidate(candidate)
      .catch((e) => console.log(e));
  };

  const updateSkippedUsers = (data) => {
    setSkippedSessions(data);
    socketRef.current.emit("join", { roomId: roomName, userskip: true });
    setRenderForce(Math.random() * 1000);
  };

  const requestMicrophonePermission = async () => {
    try {
      if (audioStreamRef.current) {
        userStreamRef.current = audioStreamRef.current;
        console.log(
          "Microphone access granted, stream initialized:",
          audioStreamRef.current
        );
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = audioStreamRef.current;
          userVideoRef.current.play();
        }
      } else {
        throw new Error("Microphone access not granted");
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const toggleMediaStream = (type, state) => {
    userStreamRef.current?.getTracks()?.forEach((track) => {
      if (track.kind === type) {
        track.enabled = !state;
      }
    });
  };

  const toggleMic = () => {
    toggleMediaStream("audio", micActive);
    setMicActive((prev) => !prev);
  };

  const handleSkipCalling = () => {
    const connectSocket = () => {
      socketRef.current.emit("skip", roomName);

      let waitingRoomsTemp = [...waitingRooms].filter((rn) => rn !== roomName);

      if (waitingRoomsTemp.length !== 0) {
        if (peerVideoRef.current.srcObject) {
          peerVideoRef.current.srcObject
            .getTracks()
            .forEach((track) => track.stop());
        }

        let roomToJoin =
          waitingRoomsTemp[Math.floor(Math.random() * waitingRoomsTemp.length)];
        if (connectionStatus === "Searching...") {
          socketRef.current.emit("onLeave", roomName);
        }

        if (rtcConnectionRef.current) {
          rtcConnectionRef.current.close();
          rtcConnectionRef.current = null;
        }

        // window.location.href = "/calling/" + roomToJoin;
        router.push(`/calling/${roomToJoin}`);
      } else {
        let roomToJoin = roomName;
        if (connectionStatus === "Searching...") {
          socketRef.current.emit("onLeave", roomName);
        }
      }
    };
    connectSocket();
  };

  const handleEndCalling = () => {
    router.push("/");
  };

  // Handle room full case
  const handleRoomFull = () => {
    console.log("Room is full, attempting to find another room...");
    let waitingRoomsTemp = [...waitingRooms].filter((rn) => rn !== roomName);

    if (waitingRoomsTemp.length > 0) {
      let roomToJoin =
        waitingRoomsTemp[Math.floor(Math.random() * waitingRoomsTemp.length)];
      setRoomName(roomToJoin);
      socketRef.current.emit("join", { roomId: roomToJoin });
    } else {
      let roomToJoin = uuidv4();
      setRoomName(roomToJoin);
      socketRef.current.emit("join", { roomId: roomToJoin });
    }
  };

  return (
    <>
      <div className="main-content-text">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 items-center ">
          <div className="class-section text-center">
            <h1 className="font-katibeh  text-[60px] mb-[20px]">
              {connectionStatus === "Connected" ? (
                <span>Connected</span>
              ) : (
                <span>Searching...</span>
              )}
            </h1>
            {connectionStatus === "Connected" && (
              <h1 className="font-katibeh  text-[60px] mb-[20px]">
                ({callDuration})
              </h1>
            )}
            <div className="flex justify-center flex-wrap items-center">
              <button
                className="m-2 btn bg-[#031E29] text-white dark:bg-white dark:text-[#000]"
                onClick={toggleMic}
              >
                <span className="flex justify-center  items-center gap-2">
                  {micActive ? (
                    <img
                      className="dark:hidden block"
                      src="../mic_svgrepo.png"
                    />
                  ) : (
                    <img className="dark:hidden block" src="../mute_icon.svg" />
                  )}
                  {micActive ? (
                    <img
                      className="dark:block hidden"
                      src="../mic_svgrepo-dark.png"
                    />
                  ) : (
                    <img
                      className="dark:block hidden"
                      src="../mute_dark-mode.svg"
                    />
                  )}
                  Mute Call
                </span>
              </button>
              <button
                className="m-2 btn bg-[#031E29] text-white dark:bg-white dark:text-[#000]"
                onClick={handleSkipCalling}
              >
                <span className="flex justify-center items-center gap-2">
                  <img
                    className="dark:hidden block"
                    src="../switch-vertical-light.png"
                  />
                  <img
                    className="dark:block hidden"
                    src="../switch-vertical-dark.png"
                  />
                  Skip Call
                </span>
              </button>
              <button
                className="m-2 btn bg-[#031E29] text-white dark:bg-white dark:text-[#000]"
                onClick={handleEndCalling}
              >
                <span className="flex justify-center items-center gap-2">
                  <img
                    className="dark:hidden block"
                    src="../cancel_svgrepo-light.png"
                  />
                  <img
                    className="dark:block hidden"
                    src="../cancel_svgrepo-dark.png"
                  />
                  End call
                </span>
              </button>
            </div>
          </div>
          <div className="message-section">
            <div className="chat-box">
              <video
                style={{ display: "none" }}
                autoPlay
                ref={userVideoRef}
                muted
              />
              <div className="messages">
                {messages.map((msg, index) => (
                  <div
                    key={uuidv4()}
                    className={`message ${
                      msg.sender == socketRef.current?.id ? "user" : "other"
                    }`}
                  >
                    {msg.message}
                  </div>
                ))}
              </div>
              <div className="input-box">
                <div className="message-input-box">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Start chatting..."
                  />
                  <video style={{ width: 5 }} autoPlay ref={peerVideoRef} />
                  <button onClick={handleSendMessage}>
                    <img className="" src="../send-icon-img.png" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Calling;
