const homeserverUrl = "https://secret.lookingforcows.com:8448";  // Change this to your server URL
let accessToken = '';
let roomId = '';  // Store room ID to track the active room

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const loginUrl = `${homeserverUrl}/_matrix/client/r0/login`;
  const loginData = {
    type: "m.login.password",
    user: username,
    password: password,
  };

  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      document.getElementById("login-container").style.display = "none";
      document.getElementById("chat-container").style.display = "block";
      console.log("Logged in successfully");
    } else {
      alert("Login failed. Check your credentials.");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Login error. Please try again.");
  }
}
