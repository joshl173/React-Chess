import {io} from "socket.io-client"; // imports connection features

const socket = io('localhost:8080'); // initialises wbesocket connection

export default socket;

/*
The io fucntion is imported from the sokcet.io-client thne the io function is called with the server address as a function.
*/