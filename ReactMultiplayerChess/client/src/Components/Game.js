import socket from "../Socket.js";
import {
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Stack,
    Typography,
    Box,
} from "@mui/material"
import { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import CustomDialog from "./CustomDialog.js"

function Game({ players, room, orientation, cleanup }) {
    const chess = useMemo(() => new Chess(), []); // (1)
    const [fen, setFen] = useState(chess.fen()); // (2)
    const [over, setOver] = useState("");

    //moving 3)
    const makeMove = useCallback(
        (move) => {
            try {
                const result = chess.move(move); //updates Chess instance
                setFen(chess.fen()); //updates the FEN state to trigger a re-drender

                console.log("over, checkmate", chess.isGameOver(), chess.isCheckmate());

                if (chess.isGameOver()) {// check if move led to "game over"
                    if (chess.isCheckmate()) {// if the reason for game over is checkmate
                        //Set message to Checkmate.
                        setOver(
                            `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
                        );
                        // The winnder is determined by checking which side made the last move
                    } else if (chess.isDraw()) { // checks if it is a draw
                        setOver("Draw"); //set message to "Draw" 
                    } else {
                        setOver("Game Over");
                    }
                }

                return result;
            } catch (e) {
                return null;
            } // null if the move was illegal, the move object if the move was legal
        },
        [chess]
    );

    //onDrop function (4)
    function onDrop(sourceSquare, targetSquare) {
        // orientation is either "white" or "black". game.turn() returns "w" or "b".
        if (chess.turn() !== orientation[0]) return false; // (4.1)

        if (players.length < 2) return false; //(4.2)

        const moveData = {
            from: sourceSquare,
            to: targetSquare,
            color: chess.turn(),
            promotion: "q", // (4.3)
        };

        const move = makeMove(moveData);

        // illegal moves
        if (move === null) return false;

        socket.emit("move", {// emit a move event
            move,
            room,
        }); // After a move is validated/played "move" is emmited along with move data. This will be transmitted to opponent via the server.

        return true;
    }

    useEffect(() => {
        socket.on("move", (move) => {
            makeMove(move); // added socket event listener when the component is mounted. When a client's server recives a move event, it is validated/played using the makeMove function
        });
    }, [makeMove]);

    useEffect(() => {
        socket.on("playerDisconnected", (player) => {
            setOver(`${player.username} has been disconnected`); // set game over
        });
    }, []);

    useEffect(() => {
        socket.on('closeRoom', ({ roomId }) => {
            if (roomId === room) {
                cleanup();
            }
        });
    }, [room, cleanup]);

    //Game component returned jsx
    return (
        <Stack> {/*(7)*/}
            <Card>
                <CardContent>
                    <Typography variant="h5">Room ID: {room}</Typography>
                </CardContent>
            </Card>
            <Stack flexDirection="row" sx={{ pt: 2 }}>
                <div className="board" style={{
                    maxWidth: 600,
                    maxHeight: 600,
                    flexGrow: 1,
                }}>
                    <Chessboard
                        position={fen}
                        onPieceDrop={onDrop}
                        boardOrientation={orientation} /> {/*(5)*/}
                </div>
                {players.length > 0 && (
                    <Box>
                        <List>
                            <ListSubheader>Players</ListSubheader>
                            {players.map((p) => (
                                <ListItem key={p.id}>
                                    <ListItemText primary={p.username} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Stack>

            <CustomDialog // (6) (6.1)
                open={Boolean(over)}
                title={over}
                contentText={over}
                handleContinue={() => {
                    socket.emit("closeRoom", { roomId: room });
                    cleanup();
                }}
            />

        </Stack>
    );
}

export default Game;

/*
1)
A memorised chess instance with 0 dependencies is created. The useMemo hook lets you cache the chess instance between re-renders so that the instance is not creared on every re-render. This is used for validation and generation.

2)
An initial FEN state is set to the FEN retruned from the Chess instance.

3)
Creates makeMove function  using a useCallback hook with chess as a dependancy in order to cache the function between re-renders and avoid creating the function on every re-render.

4)
Creates onDrop fucntion that recieves two fucntion params; sourceSquare and targertSquare. The sourceSquare is the initial piece position, while targetSquare is the target position. This fucntion also contains the moveData object, which uses source, target, and color. Color is set to chess.turn() which returns the colour of the current side set to play.

4.1) updated the onDrop function to prohibt player from moving chess pieces of other player.
4.2) updated onDrop to disallow a move if the oppent has not joined.
4.3) updated onDrop to allow queen promotion when possible.

the function makeMove is called, and the function moveData is passed to the chess instance for validation and generation. True or false is then the returned value of makeMove

this fucntion accepts a move and calls chess.move with a move object as an argument. This validates the move and updates Chess instance's internal state. The Game conponent's FEN state is set to reflect that of the Chess instance, triggering a re-render and updates the chessboard.

After a move is made, the game over state is checked and if ture, it determines if it was due to checkmate or a draw and updates the game's state with the appropriate message.

the makeMove function body is also wrapped in a try-catch blcok since callling chess.move with and illegal move throws an error.  When the error is throwm a null is returned. This is handled by the onDrop function.

5)
Chessboard set up using the Chessboard component from react-chessbpard and passed the FEN notation to the position prop. Passed the onDrop function to the onPieceDrop prop, which is called everytime a pirce is moved.

6)
Creats a dialog component that will be rendered when the state "over" is true. "over" contains a piece of text that describes the reason the game is over, i.e by checkmate, stalemate, etc.

Updated import list to include UI components from Material UI

6.1) updated to return to the main menu when a game ends.

7) Updated so that the component renders stack elements to display the room ID under the <Typography> element in the fisr <Stack>. the second <Stack> sets some CSS to specify the board size. Also added boardOrientation to determine the orientation for each player, added a room ID to the top of the board, along with a list of players to the side.


*/