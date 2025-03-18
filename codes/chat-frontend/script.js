document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById("messages");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");

  // N8N API endpoint through our proxy
  const API_URL = "/api/chat"; // This will use the proxy when served through our express server

  // Generate a unique session ID for this chat session
  const sessionId =
    Math.random().toString().substring(2, 17) +
    Math.random().toString().substring(2, 17);
  console.log("Using session ID:", sessionId);

  // Function to add a message to the chat
  function addMessage(message, isUser = false) {
    const messageElement = document.createElement("div");
    messageElement.classList.add(isUser ? "user-message" : "bot-message");
    messageElement.innerText = message;
    messagesContainer.appendChild(messageElement);

    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Function to send message to the API
  async function sendMessageToAPI(message) {
    try {
      // Show loading indicator
      const loadingElement = document.createElement("div");
      loadingElement.classList.add("bot-message");
      loadingElement.innerText = "Typing...";
      messagesContainer.appendChild(loadingElement);

      console.log("Sending message to n8n:", message);

      // Structure your data to match n8n AI Agent expectations
      const payload = {
        chatInput: message,
        sessionId: sessionId,
        input: message,
        message: message,
        content: message,
        query: message
      };

      console.log("Sending payload:", payload);

      // Use POST request with JSON body
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // Log response details for debugging
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers])
      );

      let data;
      try {
        const textData = await response.text();
        console.log("Raw response:", textData);

        try {
          data = JSON.parse(textData);
          console.log("Parsed response data:", data);
        } catch (e) {
          console.warn("Response is not valid JSON, using as plain text");
          data = { text: textData };
        }
      } catch (e) {
        console.error("Error reading response:", e);
        throw new Error("Failed to read response");
      }

      // Remove loading indicator
      messagesContainer.removeChild(loadingElement);

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.message || "Network response was not ok");
      }

      // Handle n8n AI Agent response format
      let botResponse;

      // Check common response structures
      if (typeof data === "string") {
        botResponse = data;
      } else if (data.output) {
        botResponse = data.output;
      } else if (data.chatInput) {
        botResponse = data.chatInput;
      } else if (data.response) {
        botResponse = data.response;
      } else if (data.result) {
        botResponse =
          typeof data.result === "string"
            ? data.result
            : JSON.stringify(data.result);
      } else if (data.message) {
        botResponse = data.message;
      } else if (data.ai_output) {
        botResponse = data.ai_output;
      } else if (data.content) {
        botResponse = data.content;
      } else if (data.text) {
        botResponse = data.text;
      } else if (typeof data === "object" && Object.keys(data).length === 0) {
        botResponse = "No response data received from AI";
      } else {
        // If can't find in common fields, try to extract from any string field
        const stringFields = Object.entries(data)
          .filter(([_, v]) => typeof v === "string")
          .map(([k, v]) => v);

        botResponse =
          stringFields.length > 0 ? stringFields[0] : JSON.stringify(data);
      }

      addMessage(
        botResponse || "Received response but couldn't extract message content"
      );
    } catch (error) {
      console.error("Error:", error);
      // Remove loading indicator if exists
      const loadingElement = document.querySelector(".bot-message:last-child");
      if (loadingElement && loadingElement.innerText === "Typing...") {
        messagesContainer.removeChild(loadingElement);
      }

      addMessage(
        `Error: ${
          error.message ||
          "There was an error processing your request. Please try again later."
        }`
      );
    }
  }

  // Event listener for send button
  sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message !== "") {
      addMessage(message, true);
      messageInput.value = "";
      sendMessageToAPI(message);
    }
  });

  // Event listener for Enter key
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const message = messageInput.value.trim();
      if (message !== "") {
        addMessage(message, true);
        messageInput.value = "";
        sendMessageToAPI(message);
      }
    }
  });

  // Focus the input field on page load
  messageInput.focus();
});
