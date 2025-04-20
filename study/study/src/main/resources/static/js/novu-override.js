/**
 * This script overrides the Novu WebSocket connection to use our mock implementation
 * It should be included in the frontend HTML before the Novu script
 */
(function () {
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;

  // Override the WebSocket constructor
  window.WebSocket = function (url, protocols) {
    console.log("WebSocket connection intercepted:", url);

    // Check if this is a Novu WebSocket connection
    if (url.includes("ws.novu.co") || url.includes("socket.io")) {
      // Extract any query parameters from the original URL
      const originalUrl = new URL(url);
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");

      // Redirect to our mock WebSocket endpoint using relative URL
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.host;
      // Try with the direct path first (no /identify_service prefix)
      let mockUrl = `${wsProtocol}//${wsHost}/socket.io`;
      
      // Create a backup URL in case the first one fails
      const backupMockUrl = `${wsProtocol}//${wsHost}/identify_service/socket.io`;
      
      // Log the WebSocket URL for debugging
      console.log('Creating WebSocket connection to:', mockUrl);

      // Add query parameters to help identify the user
      if (originalUrl.search) {
        mockUrl += originalUrl.search;
      } else {
        mockUrl += "?EIO=4&transport=websocket";
      }

      // Add userId if available
      if (userId) {
        if (mockUrl.includes("?")) {
          mockUrl += "&userId=" + userId;
        } else {
          mockUrl += "?userId=" + userId;
        }
      }

      console.log("Redirecting to mock WebSocket endpoint:", mockUrl);
      console.log("Current user ID:", userId);

      // Create a new WebSocket with the mock URL
      let socket;
      try {
        // Use a more reliable WebSocket URL format
        // Make sure we're using the correct protocol and port
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.host;
        
        // Try different WebSocket URL formats
        let finalUrl;
        
        // First try: Direct WebSocket connection without identify_service prefix
        finalUrl = `${wsProtocol}//${wsHost}/socket.io?EIO=4&transport=websocket`;
        
        // Add userId if available
        if (userId) {
          finalUrl += `&userId=${userId}`;
        }
        
        console.log("Attempting WebSocket connection with URL:", finalUrl);
        
        try {
          socket = new OriginalWebSocket(finalUrl, protocols);
          console.log("WebSocket connection initiated");
        } catch (innerError) {
          console.error("First WebSocket connection attempt failed:", innerError);
          
          // Second try: With identify_service prefix
          try {
            finalUrl = `${wsProtocol}//${wsHost}/identify_service/socket.io?EIO=4&transport=websocket`;
            
            // Add userId if available
            if (userId) {
              finalUrl += `&userId=${userId}`;
            }
            
            console.log("Trying backup WebSocket URL:", finalUrl);
            socket = new OriginalWebSocket(finalUrl, protocols);
          } catch (backupError) {
            console.error("Backup WebSocket connection attempt failed:", backupError);
            
            // Third try: SockJS format as last resort
            try {
              finalUrl = `${wsProtocol}//${wsHost}/socket.io/websocket`;
              console.log("Trying SockJS WebSocket URL:", finalUrl);
              socket = new OriginalWebSocket(finalUrl, protocols);
            } catch (sockJsError) {
              console.error("SockJS WebSocket connection attempt failed:", sockJsError);
              throw new Error("All WebSocket connection attempts failed");
            }
          }
        }
      } catch (error) {
        console.error('Error creating WebSocket, using mock implementation:', error);
        // Create a more robust mock WebSocket object
        socket = {
          readyState: 1, // WebSocket.OPEN
          send: function(data) {
            console.log('Mock WebSocket send:', data);
            // If this is an identify message, simulate a successful response
            if (data.includes('identify') || data.includes('subscribe_to_user_updates')) {
              setTimeout(() => {
                if (this.onmessage) {
                  this.onmessage({ 
                    data: '42["user_id_set",{"success":true}]',
                    type: 'message' 
                  });
                }
              }, 200);
            }
          },
          close: function() {
            console.log('Mock WebSocket closed');
            this.readyState = 3; // WebSocket.CLOSED
            if (this.onclose) {
              this.onclose({ code: 1000, reason: 'Mock close' });
            }
          },
          // Event handlers will be set by the caller
          addEventListener: function(type, listener, options) {
            if (type === 'open' && listener) {
              // Simulate an open event
              setTimeout(() => {
                listener({ type: 'open' });
              }, 100);
            } else if (type === 'message' && listener) {
              // Store the message listener for later use
              this._messageListener = listener;
            }
            return this;
          },
          // Event handlers
          onopen: null,
          onmessage: null,
          onclose: null,
          onerror: null,
          _messageListener: null
        };
        
        // Simulate an open event
        setTimeout(() => {
          if (socket.onopen) {
            socket.onopen({ type: 'open' });
            console.log('Mock WebSocket simulated open event');
          }
          
          // Simulate a connection message
          setTimeout(() => {
            if (socket.onmessage) {
              socket.onmessage({ 
                data: '0{"sid":"mock-session-123","upgrades":[],"pingInterval":25000,"pingTimeout":5000}',
                type: 'message' 
              });
              console.log('Mock WebSocket simulated connection message');
            }
          }, 100);
        }, 100);
      }

      // Add custom event listener to send user ID after connection
      const originalAddEventListener = socket.addEventListener;
      socket.addEventListener = function (type, listener, options) {
        if (type === "open") {
          const originalListener = listener;
          listener = function (event) {
            console.log("WebSocket connection opened, sending user ID");

            // Send user ID after connection is established
            setTimeout(() => {
              if (userId) {
                const userIdMessage =
                  '42["identify",{"userId":"' + userId + '"}]';
                socket.send(userIdMessage);
                console.log("Sent user ID to WebSocket:", userIdMessage);

                // Also send a subscription message
                const subscribeMessage =
                  '42["subscribe_to_user_updates",{"userId":"' + userId + '"}]';
                socket.send(subscribeMessage);
                console.log(
                  "Sent subscription message to WebSocket:",
                  subscribeMessage
                );
              }
            }, 1000);

            // Call the original listener
            if (originalListener) {
              originalListener.call(this, event);
            }
          };
        }

        // Also intercept message events to log them
        if (type === "message") {
          const originalListener = listener;
          listener = function (event) {
            console.log("WebSocket received message:", event.data);

            // Call the original listener
            if (originalListener) {
              originalListener.call(this, event);
            }
          };
        }

        // Call the original addEventListener
        return originalAddEventListener.call(this, type, listener, options);
      };

      // Override the send method to log messages
      const originalSend = socket.send;
      socket.send = function (data) {
        console.log("WebSocket sending message:", data);

        // If this is a subscription message, make sure it includes the user ID
        if (data.includes("subscribe_to_user_updates") && userId) {
          // Check if the message already includes a user ID
          if (!data.includes('"userId"')) {
            // Add the user ID to the message
            data = data.replace("}]", ',"userId":"' + userId + '"}]');
            console.log("Added user ID to subscription message:", data);
          }
        }

        // Call the original send method
        return originalSend.call(this, data);
      };

      return socket;
    }

    // Otherwise, use the original WebSocket constructor
    return new OriginalWebSocket(url, protocols);
  };

  // Copy properties from the original WebSocket constructor
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }

  // Override the Novu API endpoint
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    console.log("Fetch intercepted:", url, options);

    // Handle both string URLs and Request objects
    let urlString = typeof url === "string" ? url : url.url;

    if (urlString && urlString.includes("api.novu.co")) {
      // Redirect to our mock API endpoint using relative URL
      const protocol = window.location.protocol;
      const host = window.location.host;
      const mockUrl = urlString.replace(
        "https://api.novu.co/v1",
        `${protocol}//${host}/identify_service/api/mock-novu`
      );
      console.log("Redirecting Novu API request to mock endpoint:", mockUrl);

      // If this is a subscriber registration request, store the user ID
      if (
        urlString.includes("/subscribers") &&
        options &&
        options.method === "POST" &&
        options.body
      ) {
        try {
          const body = JSON.parse(options.body);
          if (body.subscriberId) {
            console.log("Storing subscriber ID:", body.subscriberId);
            localStorage.setItem("userId", body.subscriberId);
            sessionStorage.setItem("userId", body.subscriberId);
          }
        } catch (e) {
          console.error("Error parsing request body:", e);
        }
      }

      // If this is a notifications feed request, log it
      if (urlString.includes("/notifications/feed")) {
        console.log("Notifications feed request intercepted");
      }

      // Create a new options object with the same properties
      const newOptions = { ...options };

      // If there's no Authorization header but we have a userId, add it
      if (
        (!newOptions.headers || !newOptions.headers.Authorization) &&
        localStorage.getItem("userId")
      ) {
        newOptions.headers = newOptions.headers || {};
        // Make sure we're using a valid token format
        const userId = localStorage.getItem("userId");
        // For mock implementation, we can use a simple format that won't trigger token validation
        newOptions.headers.Authorization = `Bearer mock_${userId}`;
        console.log("Added mock Authorization header with user ID");
      }

      return originalFetch(mockUrl, newOptions)
        .then((response) => {
          console.log("Response from mock endpoint:", response.status);
          return response;
        })
        .catch((error) => {
          console.error("Error from mock endpoint:", error);
          throw error;
        });
    }

    // Also intercept local mock-novu requests to add userId if needed
    if (urlString && urlString.includes("/identify_service/api/mock-novu")) {
      console.log("Local mock-novu request intercepted");

      // Create a new options object with the same properties
      const newOptions = { ...options };

      // If there's no Authorization header but we have a userId, add it
      if (
        (!newOptions.headers || !newOptions.headers.Authorization) &&
        localStorage.getItem("userId")
      ) {
        newOptions.headers = newOptions.headers || {};
        // Make sure we're using a valid token format
        const userId = localStorage.getItem("userId");
        // For mock implementation, we can use a simple format that won't trigger token validation
        newOptions.headers.Authorization = `Bearer mock_${userId}`;
        console.log(
          "Added mock Authorization header with user ID to local request"
        );
      }

      return originalFetch(url, newOptions);
    }

    // Otherwise, use the original fetch
    return originalFetch(url, options);
  };

  // Add a global function to manually trigger a notification
  window.triggerMockNotification = function (userId, type, payload) {
    // Store the user ID for future use
    if (userId) {
      localStorage.setItem("userId", userId);
      sessionStorage.setItem("userId", userId);
    } else {
      userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("No user ID provided or found in localStorage");
        return;
      }
    }

    // Use relative URL
    const protocol = window.location.protocol;
    const host = window.location.host;
    const url = `${protocol}//${host}/identify_service/api/mock-novu/test/notify/${userId}`;
    const body = {
      notificationType: type || "test-notification",
      payload: payload || {
        message: "This is a test notification",
        timestamp: new Date().toISOString(),
      },
    };

    console.log("Manually triggering notification:", body);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer mock_${userId}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Notification triggered:", data);

        // Try to find and reinitialize any notification bell on the page
        const bellContainer =
          document.querySelector(".notification-bell-container") ||
          document.querySelector(".novu-notification-bell") ||
          document.getElementById("notification-bell-container");

        if (bellContainer) {
          console.log("Found notification bell container, reinitializing");

          // If this is our debug page, use the initNotificationBell function
          if (typeof initNotificationBell === "function") {
            bellContainer.innerHTML = "";
            setTimeout(initNotificationBell, 500);
          }
        }
      })
      .catch((error) => {
        console.error("Error triggering notification:", error);
      });
  };

  console.log("Novu WebSocket and API connections have been overridden");
  console.log(
    "Use window.triggerMockNotification(userId, type, payload) to manually trigger a notification"
  );
})();
