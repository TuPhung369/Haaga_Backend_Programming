# Token Generation and Validation Workflows

This document details the processes of token creation, validation, and refresh in the authentication system.

## Token Generation Process

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant JwtUtils
    participant EncryptionService
    participant ActiveTokenRepo

    Client->>AuthController: Successful authentication
    AuthController->>AuthService: completeAuthentication(user)

    AuthService->>AuthService: Generate JWT ID (UUID)
    AuthService->>JwtUtils: computeDynamicSecretKey(userId, refreshExpiry)
    JwtUtils-->>AuthService: Dynamic secret key

    AuthService->>AuthService: generateToken(user, jwtId)
    Note right of AuthService: Create JWT with claims:<br/>- username<br/>- userId<br/>- refreshExpiry<br/>- scope<br/>- expiration time<br/>- jwtId

    AuthService->>AuthService: Sign JWT with HMAC-HS512

    AuthService->>AuthService: generateRefreshToken(user, jwtId)
    Note right of AuthService: Create refresh token with:<br/>- Same jwtId<br/>- Longer expiration<br/>- Same dynamic key

    AuthService->>EncryptionService: encryptToken(plainAccessToken)
    Note right of EncryptionService: 1. Generate random salt<br/>2. Derive key with PBKDF2<br/>3. Generate random IV<br/>4. Encrypt with AES-GCM<br/>5. Format: [salt][iv][encrypted]<br/>6. Base64 encode

    EncryptionService-->>AuthService: Encrypted access token

    AuthService->>EncryptionService: encryptToken(plainRefreshToken)
    EncryptionService-->>AuthService: Encrypted refresh token

    AuthService->>ActiveTokenRepo: save(ActiveToken)
    Note right of ActiveTokenRepo: Store encrypted tokens with:<br/>- jwtId<br/>- username<br/>- expiryTime<br/>- expiryRefreshTime

    AuthService-->>AuthController: AuthResponse(encryptedAccessToken, encryptedRefreshToken)
    AuthController-->>Client: Authentication response with tokens
```

## Token Validation Process

```mermaid
sequenceDiagram
    participant Client
    participant AuthFilter
    participant TokenSecurity
    participant EncryptionService
    participant AuthService
    participant JwtUtils
    participant ActiveTokenRepo

    Client->>AuthFilter: Request with Authorization header
    AuthFilter->>TokenSecurity: decryptFromClient(encryptedToken)
    TokenSecurity->>EncryptionService: decryptToken(encryptedToken)

    Note right of EncryptionService: 1. Base64 decode<br/>2. Extract salt, IV, ciphertext<br/>3. Derive key with PBKDF2<br/>4. Decrypt with AES-GCM

    EncryptionService-->>TokenSecurity: Plain JWT token
    TokenSecurity-->>AuthFilter: Plain JWT token

    AuthFilter->>AuthService: verifyToken(plainToken)

    AuthService->>AuthService: Parse JWT
    AuthService->>AuthService: Extract userId and refreshExpiry
    AuthService->>JwtUtils: computeDynamicSecretKey(userId, refreshExpiry)
    JwtUtils-->>AuthService: Dynamic secret key

    AuthService->>AuthService: Verify JWT signature
    AuthService->>AuthService: Check token expiration

    AuthService->>TokenSecurity: extractTokenId(plainToken)
    TokenSecurity-->>AuthService: JWT ID

    AuthService->>ActiveTokenRepo: findById(jwtId)
    ActiveTokenRepo-->>AuthService: ActiveToken record

    alt Token not found in database
        AuthService-->>AuthFilter: INVALID_TOKEN error
        AuthFilter-->>Client: 401 Unauthorized
    else Token found and valid
        AuthService-->>AuthFilter: Valid authentication
        AuthFilter->>AuthFilter: Set SecurityContext
        AuthFilter-->>Client: Process request
    end
```

## Token Refresh Process

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant EncryptionService
    participant JwtUtils
    participant ActiveTokenRepo

    Client->>AuthController: POST /auth/refresh (with refresh token)
    AuthController->>AuthService: refreshToken(request)

    AuthService->>EncryptionService: decryptToken(encryptedRefreshToken)
    EncryptionService-->>AuthService: Plain refresh token

    AuthService->>AuthService: verifyToken(plainRefreshToken)
    Note right of AuthService: 1. Parse JWT<br/>2. Compute dynamic key<br/>3. Verify signature<br/>4. Check expiration

    AuthService->>AuthService: Extract jwtId and username
    AuthService->>ActiveTokenRepo: findById(jwtId)
    ActiveTokenRepo-->>AuthService: ActiveToken record

    alt Token not found or expired
        AuthService-->>AuthController: INVALID_TOKEN error
        AuthController-->>Client: Error response
    else Token valid
        AuthService->>UserRepository: findByUsername(username)

        AuthService->>AuthService: generateToken(user, jwtId)
        Note right of AuthService: Create new access token with same jwtId

        AuthService->>EncryptionService: encryptToken(newPlainToken)
        EncryptionService-->>AuthService: New encrypted access token

        AuthService->>ActiveTokenRepo: Update token and expiry time

        AuthService-->>AuthController: TokenRefreshResponse(newEncryptedToken, sameRefreshToken)
        AuthController-->>Client: New access token with same refresh token
    end
```

## Technical Details

### Token Generation (generateToken)

1. **JWT ID Creation**: Each pair of access token and refresh token shares a unique JWT ID (UUID)
2. **Dynamic Key Computation**: Using userId and refresh token expiration time to create a dynamic key
3. **JWT Claims Creation**:
   - subject: username
   - userId: User ID
   - refreshExpiry: Refresh token expiration time
   - issuer: "tommem.com"
   - issueTime: Current time
   - expirationTime: Expiration time (60 minutes for access token)
   - jwtId: Unique token ID
   - scope: User permissions
4. **JWT Signing**: Using HMAC-HS512 algorithm with the dynamic key
5. **Token Encryption**: Using AES-GCM with a key derived from PBKDF2

### Token Encryption (encryptToken)

1. **Random IV Generation**: 96-bit initialization vector for AES-GCM
2. **Random Salt Generation**: 128-bit salt for PBKDF2
3. **Key Derivation with PBKDF2**: Using ENCRYPTION_KEY, salt, and 123,456 iterations
4. **AES-GCM Encryption**: Encrypting the token with a 256-bit key and IV
5. **Result Formatting**: [salt_length(1)][salt(16)][iv(12)][encrypted_data]
6. **Base64 Encoding**: For secure transmission over HTTP

### Token Decryption (decryptToken)

1. **Base64 Decoding**: Converting Base64 string to binary data
2. **Component Extraction**: Separating salt, IV, and encrypted data
3. **Key Reconstruction with PBKDF2**: Using the same salt embedded in the token
4. **AES-GCM Decryption**: Using the derived key and extracted IV
5. **Integrity Verification**: AES-GCM automatically verifies data integrity

### Token Validation (verifyToken)

1. **JWT Parsing**: Extracting claims from the token
2. **Dynamic Key Information Extraction**: userId and refreshExpiry
3. **Dynamic Key Recomputation**: Using the same algorithm as during token creation
4. **Signature Verification**: Using the dynamic key and HMAC-HS512 algorithm
5. **Expiration Check**: Ensuring the token has not expired
6. **Database Check**: Ensuring the token is still active and has not been revoked

### Token Refresh (refreshToken)

1. **Refresh Token Decryption**: Converting from encrypted form to plain JWT
2. **Refresh Token Validation**: Checking signature and expiration
3. **Database Check**: Ensuring the refresh token is still active
4. **New Access Token Creation**: Using the same JWT ID but with a new expiration
5. **New Access Token Encryption**: Using AES-GCM and PBKDF2
6. **Database Update**: Updating the token and expiration time
7. **Client Response**: Sending the new access token while keeping the same refresh token

## Benefits of this Architecture

1. **Multi-layer Security**:

   - JWT is signed to ensure integrity
   - Token is encrypted to protect content
   - Dynamic key for each user
   - Database validation to detect revoked tokens

2. **Efficiency**:

   - Refresh tokens reduce the number of logins
   - AES-GCM encryption is fast and secure
   - Dynamic keys are computed from existing information

3. **Revocation Capability**:

   - Tokens can be revoked by removing them from the database
   - Secure token refresh mechanism

4. **Protection Against Common Attacks**:
   - Protection against replay attacks through database checks
   - Protection against brute force attacks with dynamic keys and strong encryption
   - Protection against XSS attacks by encrypting tokens

