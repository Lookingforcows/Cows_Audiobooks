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
            max-width: 600px;
            margin: 20px auto;
        }
        .message {
            padding: 10px;
            margin: 5px;
            border-radius: 5px;
            max-width: 90%;
            word-wrap: break-word;
        }
        .sent {
            background-color: #e0f7fa;
            align-self: flex-end;
        }
        .received {
            background-color: #f0f0f0;
            align-self: flex-start;
        }
        .message img {
            max-width: 300px;
            max-height: 300px;
            margin-top: 5px;
        }
        .message audio, .message video {
            max-width: 300px;
            margin-top: 5px;
        }
        #messageInputContainer {
            display: flex;
            align-items: center;
        }
        #messageInput {
            flex: 1;
            padding: 10px;
            margin-right: 10px;
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

        <div id="messages" style="display: flex; flex-direction: column;"></div>

        <div id="messageInputContainer">
            <input type="text" id="messageInput" placeholder="Type a message" />
            <button id="sendMessageButton">Send</button>
        </div>

        <div id="fileInputContainer">
            <input type="file" id="fileInput" style="display: none;"/>
            <button id="attachFileButton">Attach File</button>
        </div>
    </div>

    <script>
        let client;
        let currentRoomId;

        // Use your homeserver
        const homeserverUrl = "https://secret.lookingforcows.com:8448";
        client = matrix.createClient({ baseUrl: homeserverUrl });

        document.getElementById("password").addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                document.getElementById("loginButton").click(); // Trigger login on Enter
            }
        });

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

        async function loadRooms() {
            try {
                const rooms = await client.getRooms();
                const roomListElement = document.getElementById("room-list");
                roomListElement.innerHTML = "";

                rooms.forEach(room => {
                    const li = document.createElement("li");
                    li.textContent = room.name || room.roomId;
                    li.addEventListener("click", () => joinRoom(room.roomId));
                    roomListElement.appendChild(li);
                });
            } catch (error) {
                console.error("Failed to load rooms:", error);
            }
        }

        async function joinRoom(roomId) {
            try {
                currentRoomId = roomId;
                await client.joinRoom(roomId);
                document.getElementById("messages").innerHTML = "";

                const room = client.getRoom(roomId);
                const timeline = room.getLiveTimeline();
                timeline.getEvents().forEach(event => {
                    if (event.getType() === "m.room.message") {
                        displayMessage(event.getSender(), event.getContent().body, "received");
                    }
                });

                client.on("Room.timeline", (event, room) => {
                    if (room.roomId === currentRoomId && event.getType() === "m.room.message") {
                        if (event.getContent().msgtype === "m.text") {
                            displayMessage(event.getSender(), event.getContent().body, "received");
                        } else if (event.getContent().msgtype === "m.file") {
                            displayMedia(event.getContent().url, event.getContent().body);
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to join room:", error);
            }
        }

        document.getElementById("sendMessageButton").addEventListener("click", async () => {
            const message = document.getElementById("messageInput").value;
            if (message && currentRoomId) {
                try {
                    await client.sendTextMessage(currentRoomId, message);
                    displayMessage("You", message, "sent");
                    document.getElementById("messageInput").value = "";
                } catch (error) {
                    console.error("Failed to send message:", error);
                }
            }
        });

        function displayMessage(sender, message, type) {
            const messageDiv = document.createElement("div");
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = `${sender}: ${message}`;
            document.getElementById("messages").appendChild(messageDiv);
        }

        // Handle file selection and upload
        document.getElementById("attachFileButton").addEventListener("click", () => {
            document.getElementById("fileInput").click();
        });

        document.getElementById("fileInput").addEventListener("change", async function () {
            const file = this.files[0];
            if (!file) return;

            try {
                const uploadResponse = await client.uploadContent(file);
                const fileUrl = uploadResponse.content_uri;
                await client.sendMessage(currentRoomId, {
                    msgtype: "m.file",
                    body: file.name,
                    url: fileUrl
                });
            } catch (err) {
                console.error("File upload failed:", err);
            }
        });

        // Display uploaded media in the chat
        function displayMedia(fileUrl, fileName) {
            const messageDiv = document.createElement("div");
            messageDiv.className = "message received";

            const mediaElement = document.createElement("img");
            mediaElement.src = fileUrl;
            mediaElement.alt = fileName;
            messageDiv.appendChild(mediaElement);

            document.getElementById("messages").appendChild(messageDiv);
        }
    </script>
</body>
</html>
