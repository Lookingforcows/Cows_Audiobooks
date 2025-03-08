<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matrix Chat</title>
    <script src="https://unpkg.com/matrix-js-sdk@latest"></script> <!-- Add the Matrix JS SDK -->
    <style>
        #chat-container {
            display: none;
        }
        .message {
            padding: 5px;
            margin: 5px;
            border: 1px solid #ccc;
        }
        .sent {
            background-color: #e0f7fa;
        }
        .received {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <!-- Login Form -->
    <div id="login-container">
        <h2>Login to Matrix</h2>
        <input type="text" id="username" placeholder="Username" required><br>
        <input type="password" id="password" placeholder="Password" required><br>
        <button id="loginButton">Login</button>
    </div>

    <!-- Chat Container -->
    <div id="chat-container">
        <h2>Rooms</h2>
        <ul id="room-list"></ul>

        <div id="messages"></div>

        <input type="text" id="messageInput" placeholder="Type a message" />
        <button id="sendMessageButton">Send</button>
    </div>

    <script>
        let client;
        let currentRoomId;

        // Use your homeserver
        const homeserverUrl = "https://secret.lookingforcows.com:8448";

        // Create the client once
        client = matrixcs.createClient({ baseUrl: homeserverUrl });

        // Listen for "Enter" key in password input field
        document.getElementById("password").addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                document.getElementById("loginButton").click(); // Trigger login on Enter
            }
        });

        // Login function
        document.getElementById("loginButton").addEventListener("click", async () => {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            if (username && password) {
                try {
                    const domain = "secret.lookingforcows.com"; // Your homeserver domain
                    const fullUsername = username.includes(":") ? username : `@${username}:${domain}`;
                    console.log(`Logging in as: ${fullUsername}`);

                    const loginResponse = await client.loginWithPassword(fullUsername, password);
                    client.startClient();

                    document.getElementById("login-container").style.display = "none";
                    document.getElementById("chat-container").style.display = "block";

                    loadRooms(); // Load the rooms after successful login
                } catch (error) {
                    console.error("Login failed:", error);
                    alert("Login failed! Check your username and password.");
                }
            }
        });

        // Load rooms (contacts)
        async function loadRooms() {
            try {
                const rooms = await client.getRooms(); // Getting the rooms
                const roomListElement = document.getElementById("room-list");
                roomListElement.innerHTML = "";

                rooms.forEach(room => {
                    const li = document.createElement("li");
                    li.textContent = room.name || room.roomId; // Display room name or room ID
                    li.addEventListener("click", () => joinRoom(room.roomId)); // Attach event to join room
                    roomListElement.appendChild(li);
                });
            } catch (error) {
                console.error("Failed to load rooms:", error);
            }
        }

        // Join a room and listen for messages
        async function joinRoom(roomId) {
            try {
                currentRoomId = roomId;
                await client.joinRoom(roomId); // Join the selected room
                document.getElementById("messages").innerHTML = ""; // Clear previous messages

                // Fetch previous messages
                const room = client.getRoom(roomId);
                const timeline = room.getLiveTimeline();
                timeline.getEvents().forEach(event => {
                    if (event.getType() === "m.room.message") {
                        displayMessage(event.getSender(), event.getContent().body, "received");
                    }
                });

                // Listen for new messages in the room
                client.on("Room.timeline", (event, room) => {
                    if (room.roomId === currentRoomId && event.getType() === "m.room.message") {
                        displayMessage(event.getSender(), event.getContent().body, "received");
                    }
                });
            } catch (error) {
                console.error("Failed to join room:", error);
            }
        }

        // Send a message
        document.getElementById("sendMessageButton").addEventListener("click", async () => {
            const message = document.getElementById("messageInput").value;
            if (message && currentRoomId) {
                try {
                    await client.sendTextMessage(currentRoomId, message);
                    displayMessage("You", message, "sent"); // Display the sent message
                    document.getElementById("messageInput").value = ""; // Clear input field
                } catch (error) {
                    console.error("Failed to send message:", error);
                }
            }
        });

        // Display messages in chat bubbles
        function displayMessage(sender, message, type) {
            const messageDiv = document.createElement("div");
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = `${sender}: ${message}`;
            document.getElementById("messages").appendChild(messageDiv);
        }
    </script>
</body>
</html>
