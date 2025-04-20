package com.database.study.mock;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketExtension;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import lombok.extern.slf4j.Slf4j;

/**
 * A mock implementation of WebSocketSession for testing
 */
@Slf4j
public class MockWebSocketSession implements WebSocketSession {

    private final String id;
    private final Map<String, Object> attributes = new HashMap<>();
    private final HttpHeaders headers = new HttpHeaders();
    private final List<WebSocketMessage<?>> sentMessages = new ArrayList<>();
    private boolean open = true;
    private URI uri;

    public MockWebSocketSession(String id) {
        this.id = id;
        try {
            this.uri = new URI("ws://localhost:9095/socket.io/?EIO=4&transport=websocket&userId=" + id);
        } catch (URISyntaxException e) {
            log.error("Error creating URI for mock session", e);
        }
    }

    @Override
    public String getId() {
        return id;
    }

    @Override
    public URI getUri() {
        return uri;
    }

    @Override
    public HttpHeaders getHandshakeHeaders() {
        return headers;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Principal getPrincipal() {
        return null;
    }

    @Override
    public InetSocketAddress getLocalAddress() {
        return null;
    }

    @Override
    public InetSocketAddress getRemoteAddress() {
        return null;
    }

    @Override
    public String getAcceptedProtocol() {
        return null;
    }

    @Override
    public void setTextMessageSizeLimit(int messageSizeLimit) {
        // Do nothing
    }

    @Override
    public int getTextMessageSizeLimit() {
        return 0;
    }

    @Override
    public void setBinaryMessageSizeLimit(int messageSizeLimit) {
        // Do nothing
    }

    @Override
    public int getBinaryMessageSizeLimit() {
        return 0;
    }

    @Override
    public List<WebSocketExtension> getExtensions() {
        return null;
    }

    @Override
    public void sendMessage(WebSocketMessage<?> message) throws IOException {
        if (!isOpen()) {
            throw new IOException("Session is closed");
        }
        sentMessages.add(message);
        log.info("Mock session {} sent message: {}", id, message.getPayload());
    }

    @Override
    public boolean isOpen() {
        return open;
    }

    @Override
    public void close() throws IOException {
        close(CloseStatus.NORMAL);
    }

    @Override
    public void close(CloseStatus status) throws IOException {
        open = false;
        log.info("Mock session {} closed with status: {}", id, status);
    }

    /**
     * Get the list of messages sent to this session
     * @return The list of messages
     */
    public List<WebSocketMessage<?>> getSentMessages() {
        return sentMessages;
    }
}