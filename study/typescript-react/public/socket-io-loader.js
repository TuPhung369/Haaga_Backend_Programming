/**
 * This script provides a mock Socket.io implementation for Novu
 * when the actual WebSocket server is not available
 */
(function() {
  console.log("Novu WebSocket mock initialized");
  
  // Create a mock Socket.io implementation
  window.io = function(url, options) {
    console.log("Creating mock Socket.io connection to:", url);
    console.log("Socket.io options:", options);
    
    // Extract user ID from options
    const userId = options && options.query ? (options.query.userId || options.query.subscriberId) : null;
    console.log("User ID for mock Socket.io:", userId);
    
    // Create a mock socket object
    const mockSocket = {
      // Connection state
      connected: false,
      disconnected: true,
      
      // Event callbacks
      _callbacks: {},
      
      // Connect method
      connect: function() {
        console.log("Mock Socket.io connecting...");
        this.connected = true;
        this.disconnected = false;
        
        // Trigger connect event
        setTimeout(() => {
          this._trigger('connect');
          console.log("Mock Socket.io connected");
          
          // Send a connection acknowledgment
          setTimeout(() => {
            this._trigger('message', {
              type: 'connect',
              data: { sid: 'mock-session-id', upgrades: [], pingInterval: 25000, pingTimeout: 5000 }
            });
          }, 100);
        }, 50);
        
        return this;
      },
      
      // Disconnect method
      disconnect: function() {
        console.log("Mock Socket.io disconnecting...");
        this.connected = false;
        this.disconnected = true;
        this._trigger('disconnect', 'io client disconnect');
        return this;
      },
      
      // Emit method
      emit: function(event, data) {
        console.log(`Mock Socket.io emitting event: ${event}`, data);
        
        // Handle specific events
        if (event === 'identify' || event === 'set_user_id') {
          console.log("User identification received");
          
          // Send a success response
          setTimeout(() => {
            this._trigger('user_id_set', { success: true });
          }, 100);
        }
        
        if (event === 'subscribe_to_user_updates') {
          console.log("User subscription received");
          
          // Send a success response
          setTimeout(() => {
            this._trigger('subscription_success', { success: true });
          }, 100);
          
          // Send a mock notification after a delay
          if (userId) {
            setTimeout(() => {
              this._trigger('notification', {
                _id: 'mock-notification-' + Date.now(),
                _userId: userId,
                type: 'mock-notification',
                content: 'This is a mock notification',
                timestamp: new Date().toISOString()
              });
              
              // Also trigger unseen count
              this._trigger('unseen_count_changed', { count: 1 });
            }, 3000);
          }
        }
        
        return this;
      },
      
      // On method to register event handlers
      on: function(event, callback) {
        console.log(`Mock Socket.io registering handler for event: ${event}`);
        if (!this._callbacks[event]) {
          this._callbacks[event] = [];
        }
        this._callbacks[event].push(callback);
        return this;
      },
      
      // Off method to remove event handlers
      off: function(event, callback) {
        console.log(`Mock Socket.io removing handler for event: ${event}`);
        if (this._callbacks[event]) {
          if (callback) {
            this._callbacks[event] = this._callbacks[event].filter(cb => cb !== callback);
          } else {
            delete this._callbacks[event];
          }
        }
        return this;
      },
      
      // Internal method to trigger events
      _trigger: function(event, ...args) {
        console.log(`Mock Socket.io triggering event: ${event}`, args);
        if (this._callbacks[event]) {
          this._callbacks[event].forEach(callback => {
            try {
              callback(...args);
            } catch (err) {
              console.error(`Error in ${event} handler:`, err);
            }
          });
        }
      }
    };
    
    // Automatically connect
    setTimeout(() => {
      mockSocket.connect();
    }, 0);
    
    return mockSocket;
  };
  
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Override the WebSocket constructor to provide a mock implementation for Novu
  window.WebSocket = function(url, protocols) {
    console.log("WebSocket connection intercepted:", url);
    
    // Check if this is a Novu WebSocket connection
    if (url.includes("socket.io") || url.includes("ws.novu.co")) {
      console.log("Novu WebSocket connection detected");
      
      // Extract user ID from URL or localStorage
      let userId = null;
      
      // Try to get from localStorage
      try {
        userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      } catch (e) {
        console.warn("Error accessing localStorage:", e);
      }
      
      // Try to extract from URL
      if (!userId && url.includes("userId=")) {
        const match = url.match(/userId=([^&]*)/);
        if (match && match[1]) {
          userId = match[1];
        }
      }
      
      console.log("User ID for WebSocket:", userId);
      
      // Create a mock WebSocket object
      const mockSocket = {
        // WebSocket state
        readyState: 0, // CONNECTING
        
        // Event handlers
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        
        // Event listeners
        _listeners: {},
        
        // Send method
        send: function(data) {
          console.log("Mock WebSocket sending data:", data);
          
          // If this is an identification message, simulate a response
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
        
        // Close method
        close: function() {
          console.log("Mock WebSocket closed");
          this.readyState = 3; // CLOSED
          if (this.onclose) {
            this.onclose({ code: 1000, reason: 'Mock close' });
          }
          this._trigger('close', { code: 1000, reason: 'Mock close' });
        },
        
        // Add event listener
        addEventListener: function(type, listener, options) {
          console.log(`Mock WebSocket adding listener for: ${type}`);
          if (!this._listeners[type]) {
            this._listeners[type] = [];
          }
          this._listeners[type].push(listener);
          
          // If this is an open event, simulate connection
          if (type === 'open') {
            setTimeout(() => {
              this._trigger('open', { type: 'open' });
            }, 100);
          }
          
          return this;
        },
        
        // Remove event listener
        removeEventListener: function(type, listener) {
          console.log(`Mock WebSocket removing listener for: ${type}`);
          if (this._listeners[type]) {
            this._listeners[type] = this._listeners[type].filter(l => l !== listener);
          }
          return this;
        },
        
        // Internal method to trigger events
        _trigger: function(type, event) {
          console.log(`Mock WebSocket triggering event: ${type}`);
          
          // Call the onX handler if defined
          const handlerName = 'on' + type;
          if (this[handlerName]) {
            this[handlerName](event);
          }
          
          // Call all listeners
          if (this._listeners[type]) {
            this._listeners[type].forEach(listener => {
              try {
                listener(event);
              } catch (err) {
                console.error(`Error in ${type} listener:`, err);
              }
            });
          }
        }
      };
      
      // Simulate connection
      setTimeout(() => {
        mockSocket.readyState = 1; // OPEN
        mockSocket._trigger('open', { type: 'open' });
        
        // Simulate a connection message
        setTimeout(() => {
          mockSocket._trigger('message', { 
            data: '0{"sid":"mock-session-123","upgrades":[],"pingInterval":25000,"pingTimeout":5000}',
            type: 'message' 
          });
        }, 100);
      }, 100);
      
      return mockSocket;
    }
    
    // For non-Novu connections, use the original WebSocket
    try {
      return new OriginalWebSocket(url, protocols);
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      
      // If the connection fails, return a mock WebSocket
      console.log("Falling back to mock WebSocket");
      
      // Create a mock WebSocket object
      const fallbackMock = {
        readyState: 0,
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        _listeners: {},
        
        send: function(data) {
          console.log("Fallback mock WebSocket sending data:", data);
        },
        
        close: function() {
          console.log("Fallback mock WebSocket closed");
          this.readyState = 3;
          if (this.onclose) {
            this.onclose({ code: 1000, reason: 'Mock close' });
          }
          this._trigger('close', { code: 1000, reason: 'Mock close' });
        },
        
        addEventListener: function(type, listener, options) {
          console.log(`Fallback mock WebSocket adding listener for: ${type}`);
          if (!this._listeners[type]) {
            this._listeners[type] = [];
          }
          this._listeners[type].push(listener);
          
          // If this is an error event, simulate an error
          if (type === 'error') {
            setTimeout(() => {
              this._trigger('error', { type: 'error', message: 'Connection failed' });
            }, 100);
          }
          
          return this;
        },
        
        removeEventListener: function(type, listener) {
          console.log(`Fallback mock WebSocket removing listener for: ${type}`);
          if (this._listeners[type]) {
            this._listeners[type] = this._listeners[type].filter(l => l !== listener);
          }
          return this;
        },
        
        _trigger: function(type, event) {
          console.log(`Fallback mock WebSocket triggering event: ${type}`);
          
          const handlerName = 'on' + type;
          if (this[handlerName]) {
            this[handlerName](event);
          }
          
          if (this._listeners[type]) {
            this._listeners[type].forEach(listener => {
              try {
                listener(event);
              } catch (err) {
                console.error(`Error in ${type} listener:`, err);
              }
            });
          }
        }
      };
      
      // Simulate an error
      setTimeout(() => {
        fallbackMock.readyState = 3; // CLOSED
        fallbackMock._trigger('error', { type: 'error', message: 'Connection failed' });
        fallbackMock._trigger('close', { code: 1006, reason: 'Connection failed' });
      }, 100);
      
      return fallbackMock;
    }
  };
  
  // Copy properties from the original WebSocket constructor
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }
  
  console.log("Novu WebSocket mock setup completed");
})();