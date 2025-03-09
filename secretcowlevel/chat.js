// This file is for chat functionality and works after login

// Set your homeserver URL
const homeserverUrl = "https://secret.lookingforcows.com:8448"; // Use your actual homeserver URL
let accessToken = ''; // Access token for authorized requests
let roomId = ''; // Store roomId for the current chat room

// This function is triggered after login, when you have the accessToken
function setAccessToken(token) {
  accessToken = token;
  document.getElementById("login-container").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
}

// Fetch and display messages in the room
async function getRoomMessages() {
  if (!roomId) return; // Ensure roomId is valid

  const messagesUrl = `${homeserverUrl}/_matrix/client/r0/rooms/${roomId}/messages?limit=50`;

  try {
    const response = await fetch(messagesUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.chunk && data.chunk.length > 0) {
      const messagesList = data.chunk.map(message => {
        return `<div class="message"><strong>${message.sender}</strong>: ${message.body}</div>`;
      }).join('');
      document.getElementById("messages").innerHTML = messagesList;
    } else {
      console.log("No messages found.");
    }
  } catch (err) {
    console.error("Error fetching room messages:", err);
  }
}

// Fetch and display room members
async function getRoomMembers() {
  if (!roomId) return; // Ensure roomId is valid

  const membersUrl = `${homeserverUrl}/_matrix/client/r0/rooms/${roomId}/members`;

  try {
    const response = await fetch(membersUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.chunk) {
      const membersList = data.chunk.map(member => {
        return `<li>${member.displayname || member.user_id}</li>`;
      }).join('');
      document.getElementById("members-list").innerHTML = `<h4>Room Members:</h4><ul>${membersList}</ul>`;
    } else {
      console.log("No members found.");
    }
  } catch (err) {
    console.error("Error fetching room members:", err);
  }
}

// Send a message to the room
async function sendMessage() {
  const message = document.getElementById("message").value;

  if (!roomId || !message) {
    alert("Please enter a message.");
    return;
  }

  const messageUrl = `${homeserverUrl}/_matrix/client/r0/rooms/${roomId}/send/m.room.message`;

  const messageData = {
    msgtype: "m.text",
    body: message,
  };

  try {
    const response = await fetch(messageUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    const data = await response.json();
    if (data.event_id) {
      document.getElementById("messages").innerHTML += `<div class="message"><strong>You:</strong> ${message}</div>`;
      document.getElementById("message").value = ""; // Clear the input
    } else {
      alert("Error sending message.");
    }
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Error sending message.");
  }
}

// Join a room
async function joinRoom() {
  roomId = document.getElementById("roomId").value;

  if (!roomId) {
    alert("Please enter a valid room ID.");
    return;
  }

  const joinUrl = `${homeserverUrl}/_matrix/client/r0/rooms/${roomId}/join`;

  try {
    const response = await fetch(joinUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.room_id) {
      console.log(`Joined room: ${data.room_id}`);
      getRoomMessages();  // Fetch initial messages
      getRoomMembers();   // Fetch room members
    } else {
      console.log("Error joining room.");
    }
  } catch (err) {
    console.error("Error joining room:", err);
  }
}

// Poll for new messages every 5 seconds
setInterval(() => {
  if (roomId) {
    getRoomMessages(); // Refresh messages every 5 seconds
  }
}, 5000);
