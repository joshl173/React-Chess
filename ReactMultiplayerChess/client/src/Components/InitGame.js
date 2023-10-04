import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import CustomDialog from "./CustomDialog";
import socket from "../Socket";

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [roomInput, setRoomInput] = useState(''); // Input State
    const [roomError, setRoomError] = useState('');

    return (
        <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ py: 1, height: "100vh" }}
        >
            <CustomDialog
                open={roomDialogOpen}
                handleClose={() => setRoomDialogOpen(false)}
                title="Select Room to Join"
                contentText="Enter a valid Room ID to Join the room"
                handleContinue={() => {
                    // join a room

                    if (!roomInput) return; // if given room input is valid, do nothing.
                    socket.emit("joinRoom", { roomId: roomInput }, (r) => {
                        // r is the response from the server
                        if (r.error) return setRoomError(r.message); //if an error is returned in the response set roomError to the error message and exit
                        console.log("response", r);
                        setRoom(r?.roomId); // sets the room to the Room ID
                        setPlayers(r?.players); // set players array to the array of players within the room
                        setOrientation("black"); // sets orientation as black
                        setRoomDialogOpen(false); //closes the dialog box
                    });
                }}
            >
                <TextField
                    autofocusmargin="dense"
                    id="room"
                    label="Room ID"
                    name="room"
                    value={roomInput}
                    required
                    onChange={(e) => setRoomInput(e.target.value)}
                    type="text"
                    fullwidthvariant="standard"
                    error={Boolean(roomError)}
                    helperText={!roomError ? 'Enter a Room ID' : `Invalid Room ID: ${roomError}`}
                />
            </CustomDialog>
            <Button
                variant="contained"
                onClick={() => {
                    //creates a room. the value of the response of (r) will be the room's ID. Payers who create the room defautl to white position.
                    socket.emit("createRoom", (r) => {
                        console.log("room ID:" + r);
                        setRoom(r);
                        setOrientation("white");
                    });
                }}
            >
                Start Game
            </Button>
            {/* Button for joining a new game*/}
            <Button
                onClick={() => {
                    setRoomDialogOpen(true)
                }}
            >
                Join a game
            </Button>
        </Stack>
    );
}

/*
Init game component with three states:
    roomDialog
    Boolean state that determines if the CustomDialog should be rendered. This contains a text field that allows the user to enter a Room ID they wnat to join.

    roomInput
    This state enables the componet to control the text input. It contains the Room ID the user provided.

    roomError
    Keeps track of whatever error may be encountered when trying to join a room

The Stack component is used to wrap other elements.

Created a dialog box that contains a text field that will ebable a user to enter a room ID

Created a button to start a new game and another to join a game using a room ID

The props (setRoom, setOrientation, setPlayers) are functions to update the app state.

The Join Room code snippet:
    A socket.io event called joinRoom is emitted along with the Room ID when a user clicks on the 'continue' button in the dialog box.

    A callback function is also used to recieve a response from the server.

    The room and players states are set to the respoective data returned from the callback, and orientation is set to black.

*/