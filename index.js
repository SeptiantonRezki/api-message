/**
 * Module dependencies.
 */

var express = require("express");
var app = express();
var httpServer = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer);
var handler = require("./handler");
var port = 8080;

// Sets up express static server directory to the /public folder
app.use(express.static(__dirname + "/public"));

// Holds an array of users connected
var nicknames = [];

io.on("connection", (socket) => {
  var nicknameTaken;
  socket.on("new-user", function (data) {
    console.log(nicknames);
    if (nicknames != null) {
      nicknames.forEach(function (name) {
        if (name.toLowerCase() === data.nickname.toLowerCase()) {
          nicknameTaken = true; // Set nicknameTaken to true if name already exists
          return;
        }
      });
      if (nicknameTaken) {
        // Send notification to client that username already exists
        socket.emit("nickname taken");
      } else {
        nicknames.push(data.nickname);
        socket.emit("welcome", data.nickname, nicknames);
        // Broadcast to other clients that a user has joined
        socket.broadcast.emit("user-joined", data.nickname, nicknames);
      }
    }
  });

  //   // Listening for chat messages being sent
  socket.on("outgoing", function (data) {
    var eventArgs = {
      nickname: "nickname",
      message: data.message,
    };
    socket.emit("incoming", eventArgs, true);
    socket.broadcast.emit("incoming", eventArgs, false);
  });

  //   // Listening for when someone leaves - native listener for socket.io
  socket.on("disconnect", function () {
    // Remove username from users
    nicknames.splice(nicknames.indexOf("nickname"), 1);

    // Don't need to broadcast if there are no users left
    if (nicknames.length === 0) return;

    // Notify existing users that someone left
    socket.broadcast.emit("user-left", "nickname", nicknames);
  });

  console.log("user disconnected!");
});

httpServer.listen(port, () => {
  console.log("Server listening at http://localhost:" + port);
});

// ExpressJS routes using the 'get' verb
app.get("/", handler);
