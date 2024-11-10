// pages/api/socket.js

import { Server } from "socket.io";

var waiting_queue = [];
var active_sessions = [];
var messages = {};
var skipped_sessions = {};
var active_sessions_users = {};

const SocketHandler = (req, res) => {
  
  if (res.socket.server.io) {
  
    return res.end("hello");
  }
  const io = new Server(res.socket.server);

  res.socket.server.io = io;

  io.on("connection", (socket) => {
   
    var user_token = socket.id;
    socket.emit("getWaitingRooms", { waiting_queue, active_sessions_users });
    // Triggered when a peer hits the join room button.
    socket.on("join", (roomName) => {
     
      if (!roomName) return;
      const { rooms } = io.sockets.adapter;
      const room = rooms.get(roomName);
      
      // room == undefined when no such room exists.
      if (room === undefined) {
        socket.join(roomName);
        socket.emit("created");
        messages[roomName] = [];
        if (waiting_queue.indexOf(roomName) == -1) {
          waiting_queue.push(roomName);
        }
        active_sessions_users[roomName] = [user_token];
        socket.emit("getWaitingRooms", {
          waiting_queue,
          active_sessions_users,
        });
        socket.broadcast.emit("getWaitingRooms", {
          waiting_queue,
          active_sessions_users,
        });
      } else if (room.size === 1) {
        // room.size == 1 when one person is inside the room.
       
        socket.join(roomName);
        socket.emit("joined");
        waiting_queue.splice(waiting_queue.indexOf(roomName), 1);
        active_sessions.push(roomName);
        active_sessions_users[roomName].push(user_token);
        socket.emit("getWaitingRooms", {
          waiting_queue,
          active_sessions_users,
        });
        socket.broadcast.emit("getWaitingRooms", {
          waiting_queue,
          active_sessions_users,
        });
        
      } else {
      
        // when there are already two people inside the room.
        socket.emit("full");
      }
    });

    // Triggered when the person who joined the room is ready to communicate.
    socket.on("ready", (roomName) => {
      socket.broadcast.to(roomName).emit("ready"); // Informs the other peer in the room.
    });

    // Triggered when server gets an icecandidate from a peer in the room.
    socket.on("ice-candidate", (candidate, roomName) => {
      console.log(candidate);
      socket.broadcast.to(roomName).emit("ice-candidate", candidate); // Sends Candidate to the other peer in the room.
    });

    // Triggered when server gets an offer from a peer in the room.
    socket.on("offer", (offer, roomName) => {
      socket.broadcast.to(roomName).emit("offer", offer); // Sends Offer to the other peer in the room.
    });

    // Triggered when server gets an answer from a peer in the room.
    socket.on("answer", (answer, roomName) => {
      socket.broadcast.to(roomName).emit("answer", answer); // Sends Answer to the other peer in the room.
    });

    socket.on("leave", (roomName) => {
      socket.leave(roomName);
      waiting_queue.push(roomName);
      active_sessions.splice(active_sessions.indexOf(roomName), 1);
      messages[roomName] = [];
      socket.broadcast.to(roomName).emit("leave");
      socket.emit("getWaitingRooms", { waiting_queue, active_sessions_users });
      socket.broadcast.emit("getWaitingRooms", {
        waiting_queue,
        active_sessions_users,
      });
    });

    socket.on("onLeave", (roomName) => {
      let arr = [];
      console.log("roomName", roomName);
      arr = waiting_queue.filter((id) => id !== roomName);
     
      waiting_queue = arr;
     
      // delete active_sessions_users.roomName;
      socket.broadcast.emit("getWaitingRooms", {
        waiting_queue,
        active_sessions_users,
      });
    });

    socket.on("skip", (roomName) => {
      
      // waiting_queue.push(roomName);
      active_sessions.splice(active_sessions.indexOf(roomName), 1);
      messages[roomName] = [];

      console.log("before skipping", skipped_sessions[user_token]);
      if (!skipped_sessions[user_token])
        skipped_sessions[user_token] = [roomName];
      else
        skipped_sessions[user_token].push(
          ...skipped_sessions[user_token],
          roomName
        );
      console.log("after skipping", skipped_sessions[user_token]);
      socket.emit("skipped_users", skipped_sessions[user_token]);
      socket.broadcast
        .to(roomName)
        .emit("skipped_users", skipped_sessions[user_token]);
      socket.emit("getWaitingRooms", { waiting_queue, active_sessions_users });
      socket.broadcast
        .to(roomName)
        .emit("getWaitingRooms", { waiting_queue, active_sessions_users });
      socket.broadcast
        .to(roomName)
        .emit("getWaitingRooms", { waiting_queue, active_sessions_users });
      socket.broadcast.to(roomName).emit("leave", waiting_queue);
      socket.leave(roomName);
    });

    socket.on("message_send", (data) => {
      console.log("message_send", data, Array.isArray(messages[data.roomName]));
      if (!Array.isArray(messages[data.roomName])) messages[data.roomName] = [];
      console.log("sender", socket.id, messages);
      messages[data.roomName].push({
        sender: socket.id,
        message: data.message,
      });
      
      socket.broadcast
        .to(data.roomName)
        .emit("message_recieved", messages[data.roomName]);
    });
    
  });
  return res.end();
};

export default SocketHandler;
