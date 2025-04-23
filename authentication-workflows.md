# Authentication System Workflows

This document visualizes the complex authentication workflows implemented in this project, highlighting the security features and encryption mechanisms used.

## Registration Workflow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UserRepository
    participant EmailService
    participant RecaptchaService
    participant PasswordEncoder
    participant EmailVerificationRepo

    Client->>AuthController: POST /auth/register (username, email, password, recaptchaToken)
    AuthController->>AuthService: register(request)
    AuthService->>RecaptchaService: validateHybrid(recaptchaToken)
    RecaptchaService-->>AuthService: recaptchaValid (true/false)

    alt recaptcha invalid
        AuthService-->>AuthController: RECAPTCHA_VALIDATION_FAILED
        AuthController-->>Client: Error response
    else recaptcha valid
        AuthService->>UserRepository: existsByUsername(username)
        AuthService->>UserRepository: existsByEmail(email)

        alt username or email exists
            AuthService-->>AuthController: USER_EXISTS or EMAIL_ALREADY_EXISTS
            AuthController-->>Client: Error response
        else username and email available
            AuthService->>PasswordEncoder: encode(password)
            Note right of PasswordEncoder: Password hashed with BCrypt

            AuthService->>UserRepository: save(user)
            AuthService->>AuthService: generateSixDigitCode()
            Note right of AuthService: 6-digit verification code

            AuthService->>EmailVerificationRepo: save(verificationToken)
            AuthService->>EmailService: sendEmailVerificationCode(email, firstname, code)

            EmailService-->>Client: Email with verification code
            AuthService-->>AuthController: Success response
            AuthController-->>Client: "User registered successfully! Please check your email"
        end
    end
```

## Email Verification Workflow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant EmailVerificationRepo
    participant UserRepository

    Client->>AuthController: POST /auth/verify-email (username, token)
    AuthController->>AuthService: verifyEmail(request)
    AuthService->>EmailVerificationRepo: findByToken(token)

    alt token not found
        AuthService-->>AuthController: INVALID_TOKEN
        AuthController-->>Client: Error response
    else token found
        AuthService->>AuthService: Check if token matches username
        AuthService->>AuthService: Check if token is expired
        AuthService->>AuthService: Check if token is already used

        alt validation fails
            AuthService-->>AuthController: Error (UNAUTHORIZED_ACCESS/INVALID_TOKEN)
            AuthController-->>Client: Error response
        else validation passes
            AuthService->>UserRepository: findByUsername(username)
            AuthService->>UserRepository: user.setActive(true)
            AuthService->>UserRepository: save(user)

            AuthService->>EmailVerificationRepo: token.setUsed(true)
            AuthService->>EmailVerificationRepo: save(token)

            AuthService-->>AuthController: Success response
            AuthController-->>Client: "Email verified successfully. You can now log in."
        end
    end
```

## Login Workflow with TOTP

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UserRepository
    participant PasswordEncoder
    participant TotpService
    participant TokenSecurity
    participant EncryptionService
    participant ActiveTokenRepo

    Client->>AuthController: POST /auth/initAuthentication (username, password)
    AuthController->>AuthService: initiateAuthentication(request)
    AuthService->>UserRepository: findByUsername(username)
    AuthService->>PasswordEncoder: matches(password, user.password)

    alt authentication fails
        AuthService->>AuthService: trackFailedAttempt(username)
        AuthService-->>AuthController: Error (USER_NOT_EXISTS/PASSWORD_MISMATCH)
        AuthController-->>Client: Error response
    else authentication succeeds
        AuthService->>TotpService: isTotpEnabled(username)

        alt TOTP enabled
            AuthService-->>AuthController: AuthInitResponse(requiresTotp=true)
            AuthController-->>Client: Response indicating TOTP required

            Client->>AuthController: POST /auth/totp/token (username, password, totpCode)
            AuthController->>AuthService: authenticateWithTotp(request)
            AuthService->>TotpService: verifyCode(username, totpCode)

            alt TOTP verification fails
                AuthService->>AuthService: trackFailedAttempt(username)
                AuthService-->>AuthController: Error (INVALID_TOTP)
                AuthController-->>Client: Error response
            else TOTP verification succeeds
                AuthService->>AuthService: generateToken(user)
                Note right of AuthService: JWT token with user claims

                AuthService->>EncryptionService: encryptToken(plainToken)
                Note right of EncryptionService: AES-GCM encryption with PBKDF2 dynamic key

                AuthService->>ActiveTokenRepo: save(encryptedToken)
                AuthService-->>AuthController: AuthResponse(token, refreshToken)
                AuthController-->>Client: Authentication response with tokens
            end
        else TOTP not enabled
            AuthService->>AuthService: generateToken(user)
            AuthService->>EncryptionService: encryptToken(plainToken)
            AuthService->>ActiveTokenRepo: save(encryptedToken)
            AuthService-->>AuthController: AuthResponse(token, refreshToken)
            AuthController-->>Client: Authentication response with tokens
        end
    end
```

## Forgot Password Workflow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UserRepository
    participant PasswordResetRepo
    participant EmailService

    Client->>AuthController: POST /auth/forgot-password (username, email)
    AuthController->>AuthService: initiatePasswordReset(request)
    AuthService->>UserRepository: findByUsername(username)

    alt user not found
        AuthService-->>AuthController: USER_NOT_EXISTS
        AuthController-->>Client: Error response
    else user found
        AuthService->>AuthService: Check if email matches user's email

        alt email mismatch
            AuthService-->>AuthController: UNAUTHORIZED_ACCESS
            AuthController-->>Client: Error response
        else email matches
            AuthService->>PasswordResetRepo: findByUsernameAndUsed(username, false)
            AuthService->>PasswordResetRepo: delete(existingToken) if exists

            AuthService->>AuthService: generateSixDigitCode()
            Note right of AuthService: 6-digit reset code

            AuthService->>PasswordResetRepo: save(resetToken)
            AuthService->>EmailService: sendPasswordResetEmail(email, firstname, resetCode)

            EmailService-->>Client: Email with reset code
            AuthService-->>AuthController: Success response
            AuthController-->>Client: "Password reset code has been sent to your email"
        end
    end
```

## Reset Password Workflow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant PasswordResetRepo
    participant UserRepository
    participant PasswordEncoder

    Client->>AuthController: POST /auth/reset-password-with-token (token, newPassword)
    AuthController->>AuthService: resetPasswordWithToken(request)
    AuthService->>PasswordResetRepo: findByToken(token)

    alt token not found
        AuthService-->>AuthController: INVALID_TOKEN
        AuthController-->>Client: Error response
    else token found
        AuthService->>AuthService: Check if token is expired
        AuthService->>AuthService: Check if token is already used

        alt validation fails
            AuthService-->>AuthController: INVALID_TOKEN
            AuthController-->>Client: Error response
        else validation passes
            AuthService->>UserRepository: findByUsername(resetToken.username)
            AuthService->>PasswordEncoder: encode(newPassword)
            AuthService->>UserRepository: user.setPassword(encodedPassword)
            AuthService->>UserRepository: save(user)

            AuthService->>PasswordResetRepo: resetToken.setUsed(true)
            AuthService->>PasswordResetRepo: save(resetToken)

            AuthService-->>AuthController: Success response
            AuthController-->>Client: "Password has been reset successfully"
        end
    end
```

## TOTP Setup Workflow

```mermaid
sequenceDiagram
    participant Client
    participant TotpController
    participant TotpService
    participant EncryptionService
    participant TotpSecretRepo
    participant UserRepository

    Client->>TotpController: POST /auth/totp/setup (deviceName)
    TotpController->>TotpService: createTotpSecret(username, deviceName)

    TotpService->>TotpService: generateSecretKey()
    Note right of TotpService: Random 160-bit Base32 encoded key

    TotpService->>EncryptionService: encryptTotpSecret(plainSecretKey)
    Note right of EncryptionService: AES-GCM encryption with PBKDF2 dynamic key

    TotpService->>TotpService: generateBackupCodes()
    Note right of TotpService: 10 random 8-digit backup codes

    TotpService->>TotpSecretRepo: save(totpSecret)
    TotpService->>TotpService: generateQrCodeUri(username, secretKey)

    TotpService-->>TotpController: TotpSecret with QR code URI
    TotpController-->>Client: QR code URI and secret key for setup

    Client->>TotpController: POST /auth/totp/verify (secretId, code)
    TotpController->>TotpService: verifyAndActivateTotpSecret(secretId, code)

    TotpService->>EncryptionService: decryptTotpSecret(encryptedKey)
    TotpService->>TotpService: Validate TOTP code

    alt validation fails
        TotpService-->>TotpController: Error (verification failed)
        TotpController-->>Client: Error response
    else validation succeeds
        TotpService->>TotpSecretRepo: totpSecret.setActive(true)
        TotpService->>TotpSecretRepo: save(totpSecret)

        TotpService-->>TotpController: Success with backup codes
        TotpController-->>Client: Backup codes and success message
    end
```

## Security Features

### JWT Token Security

```mermaid
flowchart TD
    A[JWT Token Creation] --> B[Generate JWT with Claims]
    B --> C[Sign with HMAC-SHA256]
    C --> D[Encrypt with AES-GCM]
    D --> E[Store in Database]
    D --> F[Send to Client]

    G[JWT Token Validation] --> H[Decrypt with AES-GCM]
    H --> I[Verify Signature]
    I --> J[Check Expiration]
    J --> K[Check Not Revoked]
    K --> L[Extract Claims]
```

### Password Security

```mermaid
flowchart TD
    A[Password Storage] --> B[BCrypt Hashing]
    B --> C[Store in Database]

    D[Password Verification] --> E[BCrypt.matches]
    E --> F{Matches?}
    F -->|Yes| G[Authentication Success]
    F -->|No| H[Authentication Failure]
    H --> I[Increment Failed Attempts]
    I --> J{Max Attempts?}
    J -->|Yes| K[Lock Account]
    J -->|No| L[Return Error]
```

### TOTP Secret Encryption

```mermaid
flowchart TD
    A[TOTP Secret Generation] --> B[Generate Random 160-bit Key]
    B --> C[Base32 Encode]
    C --> D[Encrypt with AES-GCM]
    D --> E[Generate Salt]
    E --> F[Derive Key with PBKDF2]
    F --> G[Encrypt with Derived Key]
    G --> H[Store Encrypted Secret]

    I[TOTP Verification] --> J[Retrieve Encrypted Secret]
    J --> K[Decrypt with AES-GCM]
    K --> L[Generate TOTP Code]
    L --> M[Compare with User Input]
    M --> N{Matches?}
    N -->|Yes| O[Authentication Success]
    N -->|No| P[Authentication Failure]
```

## Key Security Components

1. **Dynamic Key Derivation (PBKDF2)**

   - Master key from environment variables
   - Salt generated per encryption operation
   - High iteration count (456,789 for TOTP, 123,456 for tokens)
   - SHA-256 hash function
   - 256-bit output key

2. **AES-GCM Encryption**

   - 256-bit encryption key
   - 96-bit initialization vector (IV)
   - 128-bit authentication tag
   - Authenticated encryption providing confidentiality and integrity

3. **JWT Token Security**

   - Signed with HMAC-HS512
   - Encrypted before storage and transmission with AES-GCM
   - Contains user claims and expiration
   - Refresh token mechanism with longer validity
   - Dynamic key generation based on user ID and expiration time
   - Token revocation through database tracking

4. **TOTP Implementation**

   - RFC 4226 compliant
   - 6-digit codes
   - 30-second time window
   - Backup codes for recovery
   - Encrypted secret storage

5. **Password Security**
   - BCrypt hashing
   - Account lockout after failed attempts
   - Password complexity requirements
   - Secure reset mechanism

This comprehensive security architecture provides multiple layers of protection for user authentication and sensitive data.

