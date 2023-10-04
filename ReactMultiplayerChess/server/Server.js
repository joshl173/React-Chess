const express = require('express');
const { Server } = require("socket.io");
const { v4: uuidV4 } = require('uuid');
const http = require('http');

const app = express(); //initialises express

const server = http.createServer(app);

// sets port value recieved from the envrionment variable, or 8080 if null
const port = process.env.PORT || 8080

// upgrade http server to websocket server
const io = new Server(server, {
    cors: "*", // allows connection from any origin
});

const rooms = new Map();

//io.connection
io.on('connection', (socket) => {
    // socket referes to the client socket that just established connection
    //each socket is assigned an id
    console.log(socket.id, "connected");

    // when a username is entered in the dialog box on the client app, the server should recieve the username event data.
    socket.on('username', (username) => {
        console.log('username:', username);
        socket.data.username = username;
    });

    //createRoom
    socket.on('createRoom', async (callback) => {// callback here referes to the callback function from the client passed as data.
        const roomId = uuidV4(); // <-1
        await socket.join(roomId); // <-2

        // set roomId as a key and roomData includeing players as values in the map
        rooms.set(roomId, {// <-3
            roomId,
            players: [{ id: socket.id, username: socket.data?.username }]
        });
        // returns Map(1){'2b5b51a9-707b-42d6-9da8-dc19f863c0d0' => [{id: 'socketid', username: 'username1'}]}

        callback(roomId); //<-4 respond with roomId to client by calling the callback function from the client
    });

    socket.on('joinRoom', async (args, callback) => {
        // check if room exists and has a player waiting
        const room = rooms.get(args.roomId);
        let error, message;

        if (!room) {// if room does not exist
            error = true;
            message = 'room does not exist';
        } else if (room.length = 0) {// if room is empty
            error = true;
            message = 'room is empty';
        } else if (room.length >= 2) {// if room is full
            error = true;
            message = 'room is full'; // set message to 'room is full'
        }

        if (error) {
            // if there is an error, check if the client passed a callback
            // call it with an error object
            // exit or just exit if the callback is not given

            if (callback) {// if user passed a callback, call it with an error payload
                callback({
                    error,
                    message
                });
            }

            return; // exit
        }

        await socket.join(args.roomId); // make the joining client join the room

        // add the joining user's data to the list of players in the room
        const roomUpdate = {
            ...room,
            players: [
                ...room.players,
                { id: socket.id, username: socket.data?.username },
            ],
        };

        rooms.set(args.roomId, roomUpdate);

        callback(roomUpdate); //respond to the clientwith the room details.

        //emit an 'oppentJoined' eventto the room to tell the other player that an opponent has joined.
        socket.to(args.roomId).emit('opponentJoined', roomUpdate);
    });

    socket.on('move', (data) => {
        // emit to all sockets in the room except the emitting socket.
        socket.to(data.room).emit('move', data.move);
    });

    socket.on("disconnect", () => {
        const gameRooms = Array.from(rooms.values()); // (6)

        gameRooms.forEach((room) => { // (7)
            const userInRoom = room.players.find((player) => player.id === socket.id); // (8)

            if (userInRoom) {
                if (room.players.length < 2) {
                    // if there is only 1 player in the room, close and exit
                    rooms.delete(room.roomId);

                    return;
                }

                socket.to(room.roomId).emit("playerDisconnected", userInRoom); // (9)
            }
        });

        socket.on("closeRoom", async (data) => {
            socket.to(data.roomId).emit("closeRoom", data); //(10)

            const clientSockets = await io.in(data.roomId).fetchSockets(); // (11)

            // loop over for each socket client
            clientSockets.forEach((s) => {
                s.leave(data.roomId); // (12)
            });

            rooms.delete(data.roomId); // (13)
        });

    });

});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});

/*
This code initialises and Express server and creates a WebSocket server using the socket.io library.

The necessary libraries are imported and an Express application is initialised by calling the express() function, then and HTTP server is created using the createServer() function with the express application passed as an arguement.

The code sets the port to a calue recieved from an environment variable using process.env.PORT, or defaults to 8080 if the envrionment is not set.

A WebSocket is created by calling new Server() constructor funcion from the socket.io library, passing in te HTTP server and setting the cors origin to allow connections from any origin.

The server listens to the specified port using the sever.listen() function and logs a message to the console to indicate that it is listening for incomming connections.

1)
A new room ID is created using the uuid package.

2)
The player creating the room joins.

3)
A key-value pair is added to the rooms map with the uuid as and room data as value. The room data contains the id and a list of players.

4)
the callback function passed as data from the cliet is recieved in the listener function on the server. This callback is called at the end with the newly created roomId passed as a parameter. When the callback is called, the client recieves the roomId as a response from the server.

5)
Updated so when a "move" event is recieved on the backend, it is sent to all sockets in the room, except for the socket that generated the event. When P1 emits a move, every socket but P1 will recieve the event which will just be P2's client. P2's client needs to listen for this.

6)
The list of available rooms is stored in gameRooms variable. 

7)
Loops through every room to find whcich room the disconnecting player had joined.

8)
Iterates over list of players in the current room to find the disconnected player using the socket ID as a reference.

9)
If the disconnecting player is part of the room, playerDisconnected event is emitted and recieved by all players.

10)
informs other players in the room that the room is closing

11)
retirves all sockets in a room. The value of the fetchedSockets is an array of all clients in the room.

12)
after looping over each sokcet, make them leave the room on socket.io using the socket.leave method.

13)
deletes the room from rooms map.
*/