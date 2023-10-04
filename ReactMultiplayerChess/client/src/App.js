import {useEffect, useState, useCallback} from "react";
import Container  from "@mui/material/Container";
import Game from "./Components/Game.js";
import InitGame from "./Components/InitGame";
import CustomDialog from "./Components/CustomDialog.js";
import socket from "./Socket";
import {TextField} from "@mui/material";

export default function App() {
  const [username, setUsername] = useState("");
  //indicates if a username has been submitted
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);

  const[room, setRoom] = useState("");
  const[orientation, setOrientation] = useState("");
  const[players, setPlayers] = useState([]);

  // resets the states responsible for initialising the game
  const cleanup = useCallback(()=>{
  setRoom("");
  setOrientation("");
  setPlayers("");
  }, []);

  useEffect(()=> {
    // const username =prompt ("Username");
    // setUSername(username);
    //socket.emit("username", username);

    socket.on("opponentJoined", (roomData)=> {
      console.log("roomData", roomData)
      setPlayers(roomData.players);
    });
  }, []);

  return (
    <Container>
      <CustomDialog
      open={!usernameSubmitted} // leave open if username has not been selected
      handleClose={()=> setUsernameSubmitted(true)}
      title="Pick a username" // title of dialog
      contentText="Please select a username" // content text of dialog
      handleContinue={()=> { // indicates that the username has been submitted
        if (!username) return; //if username has not been entered, do nothing
        socket.emit("username", username); // emit a websocket event called "username" with the username as data
        setUsernameSubmitted(true); // indicates that the username has been submitted
      }}
      >
        <TextField // text input
        margin="dense"
        id="username"
        label="Username"
        name="username"
        value={username}
        required
        onChange={(e)=> setUsername(e.target.value)} //updatesusername state with value
        type="text"
        fullwidthvariant="standard"
        />
      </CustomDialog>
      {room ? (
        <Game
        room={room}
        orientation={orientation}
        username={username}
        players={players}
        //the cleanup function  will be used by Game to rese the state when a game is over
        cleanup={cleanup}
        />
      ) : (
        <InitGame
        setRoom={setRoom}
        setOrientation={setOrientation}
        setPlayers={setPlayers}
        />
      )}
    </Container>
  );
}