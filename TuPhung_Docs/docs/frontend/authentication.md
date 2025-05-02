---
sidebar_position: 3
sidebar_label: "Authentication"
---

# Authentication

## Authentication Architecture and Workflows

### Authentication System Architecture

```mermaid
classDiagram
    class AuthModule {
        +AuthContext context
        +AuthService service
        +AuthGuard guard
        +AuthInterceptor interceptor
    }

    class AuthContext {
        +User currentUser
        +boolean isAuthenticated
        +boolean isLoading
        +Error error
        +login(credentials)
        +register(userData)
        +logout()
        +refreshToken()
        +resetPassword(token, password)
        +requestPasswordReset(email)
    }

    class AuthService {
        +apiLogin(credentials)
        +apiRegister(userData)
        +apiLogout()
        +apiRefreshToken(token)
        +apiVerifyEmail(token)
        +apiRequestPasswordReset(email)
        +apiResetPassword(token, password)
        +apiVerifyOTP(otp)
        +apiVerifyTOTP(code)
        +apiSetupTOTP()
    }

    class AuthGuard {
        +canActivate(route)
        +checkPermissions(route, user)
        +redirectToLogin()
    }

    class AuthInterceptor {
        +intercept(request, next)
        +addAuthHeader(request)
        +handleAuthErrors(error)
    }

    class TokenService {
        +getToken()
        +setToken(token)
        +removeToken()
        +getRefreshToken()
        +setRefreshToken(token)
        +isTokenExpired(token)
        +decodeToken(token)
    }

    class User {
        +string id
        +string email
        +string username
        +string[] roles
        +boolean emailVerified
        +boolean mfaEnabled
        +string mfaType
    }

    AuthModule *-- AuthContext
    AuthModule *-- AuthService
    AuthModule *-- AuthGuard
    AuthModule *-- AuthInterceptor
    AuthContext --> User : manages
    AuthContext --> AuthService : uses
    AuthService --> TokenService : uses
    AuthInterceptor --> TokenService : uses
    AuthGuard --> TokenService : uses
```

### Authentication Workflow

This diagram illustrates the complete authentication flow, from user login/registration to token management.

```mermaid
flowchart TD
    %% Define node styles with colors
    classDef userAction fill:#4a6cf7,stroke:#2a4cd7,color:white,stroke-width:2px
    classDef uiComponent fill:#6c757d,stroke:#495057,color:white,stroke-width:2px
    classDef apiCall fill:#28a745,stroke:#1e7e34,color:white,stroke-width:2px
    classDef decision fill:#ffc107,stroke:#d39e00,color:#212529,stroke-width:2px
    classDef dataStore fill:#17a2b8,stroke:#117a8b,color:white,stroke-width:2px
    classDef error fill:#dc3545,stroke:#bd2130,color:white,stroke-width:2px

    %% Main flow
    Start([User visits Auth Page]):::userAction --> RenderAuth[Render Auth UI Components]:::uiComponent
    RenderAuth --> UserChoice{Login or Register?}:::decision

    %% Registration flow
    UserChoice -->|Register| ShowRegForm[Display Registration Form]:::uiComponent
    ShowRegForm --> FillRegForm[User Fills Registration Form]:::userAction
    FillRegForm --> ValidateForm[Client-side Validation]:::uiComponent
    ValidateForm -->|Valid| CaptchaCheck[reCAPTCHA Verification]:::uiComponent
    ValidateForm -->|Invalid| ShowErrors[Show Validation Errors]:::error
    ShowErrors --> FillRegForm

    CaptchaCheck --> ApiRegister[API: Register User]:::apiCall
    ApiRegister --> StoreDB[(Store in Database)]:::dataStore
    StoreDB --> SendEmail[Send Verification Email]:::apiCall
    SendEmail --> VerifyEmail[User Verifies Email]:::userAction
    VerifyEmail --> LoginFlow

    %% Login flow
    UserChoice -->|Login| LoginFlow[Display Login Form]:::uiComponent
    LoginFlow --> EnterCreds[User Enters Credentials]:::userAction
    EnterCreds --> ValidateCreds[Validate Credentials]:::uiComponent
    ValidateCreds -->|Valid| ApiLogin[API: Login Request]:::apiCall
    ValidateCreds -->|Invalid| ShowLoginError[Show Login Error]:::error
    ShowLoginError --> EnterCreds

    ApiLogin --> CheckMFA{MFA Required?}:::decision

    %% MFA flow
    CheckMFA -->|Yes| MFAType{MFA Type?}:::decision
    MFAType -->|TOTP| ShowTOTP[Show TOTP Input]:::uiComponent
    MFAType -->|Email| SendOTP[Send Email OTP]:::apiCall

    ShowTOTP --> EnterTOTP[User Enters TOTP]:::userAction
    SendOTP --> ShowOTP[Show OTP Input]:::uiComponent
    ShowOTP --> EnterOTP[User Enters Email OTP]:::userAction

    EnterTOTP --> VerifyTOTP[API: Verify TOTP]:::apiCall
    EnterOTP --> VerifyOTP[API: Verify Email OTP]:::apiCall

    VerifyTOTP --> AuthSuccess
    VerifyOTP --> AuthSuccess

    %% Standard auth success
    CheckMFA -->|No| AuthSuccess[Authentication Success]:::apiCall
    AuthSuccess --> GenerateJWT[Generate JWT Token]:::apiCall
    GenerateJWT --> StoreToken[Store Token in LocalStorage]:::dataStore
    StoreToken --> SetupRefresh[Setup Token Auto-Refresh]:::uiComponent
    SetupRefresh --> RedirectHome[Redirect to Dashboard]:::uiComponent

    %% Social login
    SocialStart([User Clicks Social Login]):::userAction --> SocialChoice{Choose Provider}:::decision
    SocialChoice -->|Google| GoogleAuth[Google OAuth Flow]:::apiCall
    SocialChoice -->|Facebook| FacebookAuth[Facebook OAuth Flow]:::apiCall
    SocialChoice -->|GitHub| GitHubAuth[GitHub OAuth Flow]:::apiCall

    GoogleAuth & FacebookAuth & GitHubAuth --> OAuthRedirect[OAuth Redirect]:::apiCall
    OAuthRedirect --> HandleCallback[Handle OAuth Callback]:::apiCall
    HandleCallback --> ProcessToken[Process OAuth Token]:::apiCall
    ProcessToken --> AuthSuccess
```

### Multi-Factor Authentication Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Auth UI
    participant Context as Auth Context
    participant API as Auth API
    participant DB as Database

    User->>UI: Login with credentials
    UI->>Context: login(credentials)
    Context->>API: apiLogin(credentials)
    API->>DB: Validate credentials

    alt Invalid Credentials
        DB-->>API: Authentication failed
        API-->>Context: Return error
        Context-->>UI: Show error message
        UI-->>User: Display error
    else Valid Credentials + MFA Required
        DB-->>API: Credentials valid, MFA required
        API-->>Context: Return MFA challenge
        Context-->>UI: Show MFA screen

        alt TOTP Authentication
            UI-->>User: Request TOTP code
            User->>UI: Enter TOTP code
            UI->>Context: verifyTOTP(code)
            Context->>API: apiVerifyTOTP(code)
            API->>DB: Validate TOTP
        else Email OTP
            UI-->>User: Request Email OTP
            Context->>API: apiRequestEmailOTP()
            API->>User: Send OTP email
            User->>UI: Enter Email OTP
            UI->>Context: verifyOTP(code)
            Context->>API: apiVerifyOTP(code)
            API->>DB: Validate OTP
        end

        alt MFA Valid
            DB-->>API: MFA valid
            API-->>Context: Return JWT tokens
            Context->>Context: Store tokens
            Context-->>UI: Authentication complete
            UI-->>User: Redirect to dashboard
        else MFA Invalid
            DB-->>API: MFA invalid
            API-->>Context: Return error
            Context-->>UI: Show MFA error
            UI-->>User: Display error, retry
        end
    else Valid Credentials + No MFA
        DB-->>API: Authentication successful
        API-->>Context: Return JWT tokens
        Context->>Context: Store tokens
        Context-->>UI: Authentication complete
        UI-->>User: Redirect to dashboard
    end
```

### Password Reset Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Auth UI
    participant Context as Auth Context
    participant API as Auth API
    participant Email as Email Service

    User->>UI: Click "Forgot Password"
    UI->>UI: Show password reset form
    User->>UI: Enter email address
    UI->>Context: requestPasswordReset(email)
    Context->>API: apiRequestPasswordReset(email)

    API->>API: Generate reset token
    API->>Email: Send password reset email
    Email-->>User: Password reset email

    User->>User: Open email
    User->>UI: Click reset link
    UI->>UI: Show new password form
    User->>UI: Enter new password
    UI->>Context: resetPassword(token, newPassword)
    Context->>API: apiResetPassword(token, newPassword)

    alt Valid Token
        API->>API: Update password
        API-->>Context: Password updated
        Context-->>UI: Show success message
        UI-->>User: Redirect to login
    else Invalid/Expired Token
        API-->>Context: Invalid token
        Context-->>UI: Show error message
        UI-->>User: Display error
    end
```

### TOTP Setup Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Security Settings
    participant Context as Auth Context
    participant API as Auth API

    User->>UI: Navigate to security settings
    User->>UI: Click "Enable TOTP"
    UI->>Context: setupTOTP()
    Context->>API: apiSetupTOTP()

    API->>API: Generate TOTP secret
    API-->>Context: Return secret & QR code
    Context-->>UI: Display QR code
    UI-->>User: Show QR code & instructions

    User->>User: Scan QR with authenticator app
    User->>UI: Enter verification code
    UI->>Context: verifyAndEnableTOTP(code)
    Context->>API: apiVerifyAndEnableTOTP(code)

    alt Valid Code
        API->>API: Enable TOTP for user
        API-->>Context: TOTP enabled
        Context-->>UI: Show success message
        UI-->>User: Display backup codes
    else Invalid Code
        API-->>Context: Invalid code
        Context-->>UI: Show error message
        UI-->>User: Display error
    end
```

## Authentication Components and Features

### Interactive Authentication UI Components

The Enterprise Nexus frontend implements a modern, secure authentication system with an engaging user interface that combines functionality with visual appeal:

#### Login Component Architecture

```mermaid
flowchart TD
    A[LoginPage] --> B[LoginForm]
    A --> C[SocialLoginButtons]
    A --> D[3DModelBackground]

    B --> E[EmailInput]
    B --> F[PasswordInput]
    B --> G[RememberMeCheckbox]
    B --> H[ForgotPasswordLink]
    B --> I[LoginButton]

    C --> J[GoogleButton]
    C --> K[FacebookButton]
    C --> L[GitHubButton]

    D --> M[Model3DComponent]
    D --> N[SparklesCore]

    E --> O[InputValidation]
    F --> O
    I --> P[RecaptchaV3]
    I --> Q[ShineButtonEffect]

    classDef primary fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef secondary fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    classDef utility fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff

    class A,B,C,D primary
    class E,F,G,H,I,J,K,L,M,N secondary
    class O,P,Q utility
```

| Component              | Description                              | Features                                                     |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **LoginForm**          | Core form component for credential entry | Form validation, error handling, submission state management |
| **SocialLoginButtons** | OAuth provider login options             | Integrated authentication with multiple providers            |
| **3DModelBackground**  | Interactive 3D background                | WebGL-powered animation that responds to user interaction    |
| **SparklesCore**       | Particle animation system                | Creates dynamic visual effects around interactive elements   |
| **ShineButtonEffect**  | Button enhancement                       | Adds animated shine effect on hover and focus states         |
| **RecaptchaV3**        | Invisible CAPTCHA                        | Protects against bots without user interaction               |

#### Registration Component Implementation

```typescript
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Model3D } from "../components/ui/Model3D";
import { SparklesText } from "../components/ui/SparklesText";
import { ShineBorder } from "../components/ui/ShineBorder";
import { useRecaptchaV3 } from "../hooks/useRecaptchaV3";

export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { executeRecaptcha } = useRecaptchaV3();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute reCAPTCHA
      const recaptchaToken = await executeRecaptcha("registration");

      // Register user
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        recaptchaToken,
      });

      // Registration successful - show verification message
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Registration failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation function
  const validateForm = (data: typeof formData) => {
    const errors: Record<string, string> = {};

    if (!data.username.trim()) errors.username = "Username is required";
    if (!data.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      errors.email = "Email is invalid";

    if (!data.password) errors.password = "Password is required";
    else if (data.password.length < 8)
      errors.password = "Password must be at least 8 characters";

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!data.acceptTerms)
      errors.acceptTerms = "You must accept the terms and conditions";

    return errors;
  };

  return (
    <div className="registration-container">
      <div className="registration-content">
        <SparklesText className="registration-title">
          Create Your Account
        </SparklesText>

        <ShineBorder>
          <form onSubmit={handleSubmit} className="registration-form">
            {/* Form fields */}
            {/* ... */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="registration-button"
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        </ShineBorder>
      </div>

      <div className="registration-model">
        <Model3D modelPath="/models/registration-scene.glb" />
      </div>
    </div>
  );
};
```

### Visual Enhancement Components

The authentication UI incorporates several advanced visual components that enhance user experience while maintaining performance:

| Component          | Description                         | Implementation                                                     |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| **Model3D**        | Interactive 3D model renderer       | Uses Three.js to render GLTF/GLB models with optimized performance |
| **SparklesCore**   | Particle system for visual effects  | Canvas-based particle animation with configurable parameters       |
| **SparklesText**   | Text with animated particle effects | Combines text rendering with particle effects for engaging headers |
| **ShineBorder**    | Animated border effect              | CSS-based animation that creates a moving gradient border          |
| **GradientButton** | Enhanced button component           | Button with animated gradient background and hover effects         |

#### SparklesCore Implementation

```typescript
import React, { useRef, useEffect } from "react";
import { random } from "../utils/math";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

interface SparklesCoreProps {
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleCount?: number;
  particleSpeed?: number;
  className?: string;
  colors?: string[];
}

export const SparklesCore: React.FC<SparklesCoreProps> = ({
  background = "transparent",
  minSize = 0.4,
  maxSize = 1.5,
  particleCount = 25,
  particleSpeed = 0.5,
  className = "",
  colors = ["#FFC700", "#FF0044", "#00FFFF"],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: random(0, canvas.width),
          y: random(0, canvas.height),
          size: random(minSize, maxSize),
          speedX: random(-particleSpeed, particleSpeed),
          speedY: random(-particleSpeed, particleSpeed),
          color: colors[Math.floor(random(0, colors.length))],
          alpha: random(0.1, 1),
        });
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // Draw particle
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    // Initialize
    setCanvasDimensions();
    initParticles();
    animate();

    // Handle resize
    window.addEventListener("resize", () => {
      setCanvasDimensions();
      initParticles();
    });

    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, [background, colors, maxSize, minSize, particleCount, particleSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={`sparkles-core ${className}`}
      style={{ background }}
    />
  );
};
```

## Security Implementation

### Token Management and Security

The Enterprise Nexus frontend implements a comprehensive security architecture to protect user authentication and session management:

```mermaid
flowchart TD
    A[Authentication Flow] --> B{Token Storage Strategy}

    B -->|HttpOnly Cookies| C[Secure Cookie Storage]
    B -->|Memory Storage| D[In-Memory Token]
    B -->|Local Storage| E[Encrypted Storage]

    C --> F[CSRF Protection]
    D --> G[Token Refresh]
    E --> G

    F --> H[API Requests]
    G --> H

    H --> I[Auth Interceptor]
    I --> J{Token Valid?}

    J -->|Yes| K[Add Auth Headers]
    J -->|No| L[Refresh Token]

    L --> M{Refresh Successful?}
    M -->|Yes| K
    M -->|No| N[Logout User]

    K --> O[API Call]
    N --> P[Redirect to Login]

    classDef decision fill:#FF9800,stroke:#333,stroke-width:1px,color:#fff
    classDef process fill:#4CAF50,stroke:#333,stroke-width:1px,color:#fff
    classDef action fill:#2196F3,stroke:#333,stroke-width:1px,color:#fff

    class A,B,J,M decision
    class C,D,E,F,G,H,I,K,L process
    class N,O,P action
```

| Security Feature       | Implementation                        | Purpose                                                   |
| ---------------------- | ------------------------------------- | --------------------------------------------------------- |
| **HttpOnly Cookies**   | Server-set cookies with HttpOnly flag | Prevents JavaScript access to authentication tokens       |
| **CSRF Protection**    | Custom headers and CSRF tokens        | Protects against cross-site request forgery attacks       |
| **Token Refresh**      | Automatic refresh of expiring tokens  | Maintains session without requiring re-authentication     |
| **JWE Encryption**     | Encrypted JWT tokens                  | Adds an additional layer of security for sensitive claims |
| **Secure Headers**     | Security-focused HTTP headers         | Protects against various web vulnerabilities              |
| **Inactivity Timeout** | Automatic session termination         | Logs out inactive users after a configurable period       |

### Auth Interceptor Implementation

```typescript
import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError, BehaviorSubject } from "rxjs";
import { catchError, filter, take, switchMap } from "rxjs/operators";
import { TokenService } from "./token.service";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(
    private tokenService: TokenService,
    private authService: AuthService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip interceptor for authentication endpoints
    if (this.isAuthRequest(request)) {
      return next.handle(request);
    }

    // Add auth token to request
    const token = this.tokenService.getToken();
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    // Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(error);
      })
    );
  }

  private isAuthRequest(request: HttpRequest<any>): boolean {
    return (
      request.url.includes("/auth/login") ||
      request.url.includes("/auth/register") ||
      request.url.includes("/auth/refresh-token")
    );
  }

  private addTokenHeader(
    request: HttpRequest<any>,
    token: string
  ): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.tokenService.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken(refreshToken).pipe(
          switchMap((token) => {
            this.isRefreshing = false;
            this.tokenService.setToken(token.accessToken);
            this.refreshTokenSubject.next(token.accessToken);

            return next.handle(this.addTokenHeader(request, token.accessToken));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(err);
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }
}
```

