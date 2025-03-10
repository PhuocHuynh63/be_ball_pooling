import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const SocketTest = () => {
    const [socket, setSocket] = useState(null);
    const [logs, setLogs] = useState([]);

    // Establish socket connection when component mounts
    useEffect(() => {
        const newSocket = io("http://localhost:9000");
        setSocket(newSocket);

        newSocket.on("connect", () => {
            addLog(`Connected: ${newSocket.id}`);
        });

        newSocket.on("roomCreated", (data) => {
            addLog(`Room created: ${JSON.stringify(data)}`);
        });

        newSocket.on("matchEnded", (data) => {
            addLog(`Match ended: ${JSON.stringify(data)}`);
        });

        newSocket.on("error", (error) => {
            addLog(`Error: ${error}`);
        });

        return () => newSocket.disconnect();
    }, []);

    const addLog = (message) => {
        setLogs((prevLogs) => [...prevLogs, message]);
    };

    const handleCreateRoom = () => {
        if (socket) {
            // Example matchId—replace with dynamic value as needed.
            const matchId = "1234567890";
            socket.emit("createRoom", matchId);
            addLog(`Emitted createRoom with matchId: ${matchId}`);
        }
    };

    const handleEndMatch = () => {
        if (socket) {
            const payload = {
                matchId: "1234567890",
                teamResults: [
                    {
                        teamId: "teamAId",
                        result: { score: 10, foulCount: 1, strokes: 15 },
                    },
                    {
                        teamId: "teamBId",
                        result: { score: 8, foulCount: 2, strokes: 17 },
                    },
                ],
            };
            socket.emit("endMatch", payload);
            addLog("Emitted endMatch event");
        }
    };

    return (
        <div>
            <h2>Socket.IO Test</h2>
            <button onClick={handleCreateRoom}>Create Room</button>
            <button onClick={handleEndMatch}>End Match</button>
            <div>
                <h3>Logs:</h3>
                <ul>
                    {logs.map((log, idx) => (
                        <li key={idx}>{log}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SocketTest;