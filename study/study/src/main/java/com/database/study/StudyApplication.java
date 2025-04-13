package com.database.study;

import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;

@EnableScheduling
@Slf4j
@EnableJpaRepositories(basePackages = { "com.database.study.repository" })
@SpringBootApplication(scanBasePackages = { "com.database.study" })
public class StudyApplication {

    private static final AtomicBoolean hasLogged = new AtomicBoolean(false);

    public static void main(String[] args) {
        String currentThread = Thread.currentThread().getName();

        // Chỉ tiếp tục thực thi nếu chưa log hoặc nếu đây là thread restartedMain
        if (hasLogged.compareAndSet(false, true) || "restartedMain".equals(currentThread)) {
            try {
                // Load environment variables from .env file
                Dotenv dotenv = Dotenv.configure()
                        .filename(".env")
                        .ignoreIfMissing() // Don't fail if .env is missing, allow fallback to defaults
                        .load();

                // Get the active profile (default to "dev" if not set)
                String activeProfile = System.getProperty("spring.profiles.active", "dev");

                // Chỉ log từ một thread
                if ("restartedMain".equals(currentThread)) {
                    log.info("Active profile detected: {}", activeProfile);
                }

                // Load and set environment variables based on the active profile
                switch (activeProfile) {
                    case "dev" -> configureDevProfile(dotenv);
                    case "google" -> configureGoogleProfile(dotenv);
                    case "aws" -> configureAwsProfile(dotenv);
                    default -> {
                        log.error("Unsupported profile: {}. Supported profiles are 'dev', 'google', 'aws'.", activeProfile);
                        return;
                    }
                }

                // Start the Spring Boot application
                SpringApplication application = new SpringApplication(StudyApplication.class);

                application.setBannerMode(Banner.Mode.OFF);
                application.setLogStartupInfo(false);
                application.run(args);
            } catch (Exception e) {
                if (e.getClass().getName().contains("SilentExitException")) {
                    // Không log gì cả cho exception này
                } else {
                    log.error("Application crashed!", e);
                }
            }
        }
    }

    private static void configureDevProfile(Dotenv dotenv) {
        String dbUrlDev = dotenv.get("DB_URL_DEV");
        String dbUsernameDev = dotenv.get("DB_USERNAME_DEV");
        String dbPasswordDev = dotenv.get("DB_PASSWORD_DEV");
        String oauth2ClientId = dotenv.get("OAUTH2_CLIENT_ID");
        String githubClientId = dotenv.get("GITHUB_CLIENT_ID");
        String githubClientSecret = dotenv.get("GITHUB_CLIENT_SECRET");
        String githubRedirectUri = dotenv.get("GITHUB_REDIRECT_URI");
        String facebookClientId = dotenv.get("FACEBOOK_CLIENT_ID");
        String facebookClientSecret = dotenv.get("FACEBOOK_CLIENT_SECRET");
        String facebookRedirectUri = dotenv.get("FACEBOOK_REDIRECT_URI");
        String oauth2ClientSecret = dotenv.get("OAUTH2_CLIENT_SECRET");
        String oauth2RedirectUri = dotenv.get("OAUTH2_REDIRECT_URI");
        String emailServerUsername = dotenv.get("EMAIL_SERVER_USERNAME");
        String emailServerPassword = dotenv.get("EMAIL_SERVER_PASSWORD");
        String emailServerHost = dotenv.get("EMAIL_SERVER_HOST");
        String emailServerPort = dotenv.get("EMAIL_SERVER_PORT");
        String encryptionKey = dotenv.get("ENCRYPTION_KEY");
        String jwtKey = dotenv.get("JWT_KEY");
        String recaptchaSecretV3 = dotenv.get("RECAPTCHA_SECRET_V3");
        String recaptchaSecretV2 = dotenv.get("RECAPTCHA_SECRET_V2");
        String novuApiKey = dotenv.get("NOVU_API_KEY");
        String novuAppId = dotenv.get("NOVU_APP_ID");
        String novuBaseUrl = dotenv.get("NOVU_BASE_URL");

        // Validate required variables for dev profile
        if (dbUrlDev == null || dbUsernameDev == null || dbPasswordDev == null ||
                oauth2ClientId == null || oauth2ClientSecret == null || oauth2RedirectUri == null) {
            log.error(
                    "Missing required DEV environment variables. Required: DB_URL_DEV, DB_USERNAME_DEV, DB_PASSWORD_DEV, OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET, OAUTH2_REDIRECT_URI");
            System.err.println("Missing required DEV environment variables.");
            return;
        }

        // Set system properties for Spring to use
        setSystemProperty("DB_URL_DEV", dbUrlDev);
        setSystemProperty("DB_USERNAME_DEV", dbUsernameDev);
        setSystemProperty("DB_PASSWORD_DEV", dbPasswordDev);

        // Explicitly set Spring datasource properties
        setSystemProperty("spring.datasource.url", dbUrlDev);
        setSystemProperty("spring.datasource.username", dbUsernameDev);
        setSystemProperty("spring.datasource.password", dbPasswordDev);
        setSystemProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");

        // Set custom datasource properties for our AppConfig bean
        setSystemProperty("datasource.url", dbUrlDev);
        setSystemProperty("datasource.username", dbUsernameDev);
        setSystemProperty("datasource.password", dbPasswordDev);
        setSystemProperty("datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");

        // Enable SQL logging for debugging
        setSystemProperty("logging.level.org.hibernate.SQL", "DEBUG");
        setSystemProperty("logging.level.org.hibernate.type.descriptor.sql.BasicBinder", "TRACE");

        setSystemProperty("OAUTH2_CLIENT_ID", oauth2ClientId);
        setSystemProperty("OAUTH2_CLIENT_SECRET", oauth2ClientSecret);
        setSystemProperty("OAUTH2_REDIRECT_URI", oauth2RedirectUri);
        setSystemProperty("FACEBOOK_CLIENT_ID", facebookClientId);
        setSystemProperty("FACEBOOK_CLIENT_SECRET", facebookClientSecret);
        setSystemProperty("FACEBOOK_REDIRECT_URI", facebookRedirectUri);
        setSystemProperty("GITHUB_CLIENT_ID", githubClientId);
        setSystemProperty("GITHUB_CLIENT_SECRET", githubClientSecret);
        setSystemProperty("GITHUB_REDIRECT_URI", githubRedirectUri);
        setSystemProperty("EMAIL_SERVER_USERNAME", emailServerUsername);
        setSystemProperty("EMAIL_SERVER_PASSWORD", emailServerPassword);
        setSystemProperty("EMAIL_SERVER_HOST", emailServerHost);
        setSystemProperty("EMAIL_SERVER_PORT", emailServerPort);
        setSystemProperty("ENCRYPTION_KEY", encryptionKey);
        setSystemProperty("JWT_KEY", jwtKey);
        setSystemProperty("RECAPTCHA_SECRET_V3", recaptchaSecretV3);
        setSystemProperty("RECAPTCHA_SECRET_V2", recaptchaSecretV2);
        setSystemProperty("NOVU_API_KEY", novuApiKey);
        setSystemProperty("NOVU_APP_ID", novuAppId);
        setSystemProperty("NOVU_BASE_URL", novuBaseUrl);

        // Optional variables
        setSystemProperty("BASE_URL", dotenv.get("BASE_URL"));
        setSystemProperty("APP_BASE_URI", dotenv.get("APP_BASE_URI"));
        setSystemProperty("CLIENT_REDIRECT_URI", dotenv.get("CLIENT_REDIRECT_URI"));
        setSystemProperty("CLIENT_GIT_REDIRECT_URI", dotenv.get("CLIENT_GIT_REDIRECT_URI"));
        setSystemProperty("DESKTOP_CLIENT_ID", dotenv.get("DESKTOP_CLIENT_ID"));
        setSystemProperty("DESKTOP_CLIENT_SECRET", dotenv.get("DESKTOP_CLIENT_SECRET"));

    }

    private static void configureGoogleProfile(Dotenv dotenv) {
        String dbUrlGoogle = dotenv.get("DB_URL_GOOGLE");
        String dbUsernameGoogle = dotenv.get("DB_USERNAME_GOOGLE");
        String dbPasswordGoogle = dotenv.get("DB_PASSWORD_GOOGLE");
        String oauth2ClientId = dotenv.get("OAUTH2_CLIENT_ID");
        String oauth2ClientSecret = dotenv.get("OAUTH2_CLIENT_SECRET");
        String oauth2RedirectUri = dotenv.get("OAUTH2_REDIRECT_URI");

        if (dbUrlGoogle == null || dbUsernameGoogle == null || dbPasswordGoogle == null ||
                oauth2ClientId == null || oauth2ClientSecret == null || oauth2RedirectUri == null) {
            log.error(
                    "Missing required GOOGLE environment variables. Required: DB_URL_GOOGLE, DB_USERNAME_GOOGLE, DB_PASSWORD_GOOGLE, OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET, OAUTH2_REDIRECT_URI");
            return;
        }

        setSystemProperty("DB_URL_GOOGLE", dbUrlGoogle);
        setSystemProperty("DB_USERNAME_GOOGLE", dbUsernameGoogle);
        setSystemProperty("DB_PASSWORD_GOOGLE", dbPasswordGoogle);
        setSystemProperty("OAUTH2_CLIENT_ID", oauth2ClientId);
        setSystemProperty("OAUTH2_CLIENT_SECRET", oauth2ClientSecret);
        setSystemProperty("OAUTH2_REDIRECT_URI", oauth2RedirectUri);

        log.info("GOOGLE profile configured successfully with MySQL datasource: {}", dbUrlGoogle);
    }

    private static void configureAwsProfile(Dotenv dotenv) {
        String dbUrlAws = dotenv.get("DB_URL_AWS");
        String dbUsernameAws = dotenv.get("DB_USERNAME_AWS");
        String dbPasswordAws = dotenv.get("DB_PASSWORD_AWS");
        String oauth2ClientId = dotenv.get("OAUTH2_CLIENT_ID");
        String oauth2ClientSecret = dotenv.get("OAUTH2_CLIENT_SECRET");
        String oauth2RedirectUri = dotenv.get("OAUTH2_REDIRECT_URI");

        if (dbUrlAws == null || dbUsernameAws == null || dbPasswordAws == null ||
                oauth2ClientId == null || oauth2ClientSecret == null || oauth2RedirectUri == null) {
            log.error(
                    "Missing required AWS environment variables. Required: DB_URL_AWS, DB_USERNAME_AWS, DB_PASSWORD_AWS, OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET, OAUTH2_REDIRECT_URI");
            return;
        }

        setSystemProperty("DB_URL_AWS", dbUrlAws);
        setSystemProperty("DB_USERNAME_AWS", dbUsernameAws);
        setSystemProperty("DB_PASSWORD_AWS", dbPasswordAws);
        setSystemProperty("OAUTH2_CLIENT_ID", oauth2ClientId);
        setSystemProperty("OAUTH2_CLIENT_SECRET", oauth2ClientSecret);
        setSystemProperty("OAUTH2_REDIRECT_URI", oauth2RedirectUri);

        log.info("AWS profile configured successfully with MySQL datasource: {}", dbUrlAws);
    }

    private static void setSystemProperty(String key, String value) {
        if (value != null) {
            System.setProperty(key, value);
            log.debug("Set system property: {} = {}", key, value);
        } else {
            log.warn("Environment variable for {} is not set.", key);
        }
    }
}