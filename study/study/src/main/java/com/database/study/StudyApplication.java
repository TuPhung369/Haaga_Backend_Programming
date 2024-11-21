package com.database.study;

import lombok.extern.slf4j.Slf4j;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Slf4j
@SpringBootApplication(scanBasePackages = { "com.database.study" })
public class StudyApplication {

	public static void main(String[] args) {
		// Load environment variables from .env file
		Dotenv dotenv = Dotenv.configure().load();

		if (dotenv == null) {
			System.err.println("Dotenv failed to load the .env file.");
			return; // Exit application
		}

		// Load and validate environment variables
		String dbUrl = dotenv.get("DB_URL");
		String dbUsername = dotenv.get("DB_USERNAME");
		String dbPassword = dotenv.get("DB_PASSWORD");
		String baseUrl = dotenv.get("BASE_URL");
		String oauth2ClientId = dotenv.get("OAUTH2_CLIENT_ID");
		String oauth2ClientSecret = dotenv.get("OAUTH2_CLIENT_SECRET");
		String clientRedirectUri = dotenv.get("CLIENT_REDIRECT_URI");
		String oauth2RedirectUri = dotenv.get("OAUTH2_REDIRECT_URI");
		String googleAuthUrl = dotenv.get("GOOGLE_AUTH_URL");
		String desktopClientId = dotenv.get("DESKTOP_CLIENT_ID");
		String desktopClientSecret = dotenv.get("DESKTOP_CLIENT_SECRET");
		String githubAppId = dotenv.get("GITHUB_APP_ID");
		String githubClientId = dotenv.get("GITHUB_CLIENT_ID");
		String githubClientSecret = dotenv.get("GITHUB_CLIENT_SECRET");
		String githubRedirectUri = dotenv.get("GITHUB_REDIRECT_URI");

		if (dbUrl == null || dbUsername == null || dbPassword == null || oauth2ClientId == null
				|| oauth2ClientSecret == null) {
			System.err.println("Required environment variables are missing. Please check your .env file.");
			return; // Exit application
		}

		// Set system properties from environment variables
		setSystemProperty("DB_URL", dbUrl);
		setSystemProperty("DB_USERNAME", dbUsername);
		setSystemProperty("DB_PASSWORD", dbPassword);
		setSystemProperty("BASE_URL", baseUrl);
		setSystemProperty("OAUTH2_CLIENT_ID", oauth2ClientId);
		setSystemProperty("OAUTH2_CLIENT_SECRET", oauth2ClientSecret);
		setSystemProperty("CLIENT_REDIRECT_URI", clientRedirectUri);
		setSystemProperty("OAUTH2_REDIRECT_URI", oauth2RedirectUri);
		setSystemProperty("GOOGLE_AUTH_URL", googleAuthUrl);
		setSystemProperty("DESKTOP_CLIENT_ID", desktopClientId);
		setSystemProperty("DESKTOP_CLIENT_SECRET", desktopClientSecret);
		setSystemProperty("GITHUB_APP_ID", githubAppId);
		setSystemProperty("GITHUB_CLIENT_ID", githubClientId);
		setSystemProperty("GITHUB_CLIENT_SECRET", githubClientSecret);
		setSystemProperty("GITHUB_REDIRECT_URI", githubRedirectUri);

		// Start the application
		SpringApplication.run(StudyApplication.class, args);
	}

	/**
	 * Helper method to set a system property if the value is not null.
	 */
	private static void setSystemProperty(String key, String value) {
		if (value != null) {
			System.setProperty(key, value);
		} else {
			System.err.println("Environment variable for " + key + " is not set. Please check your .env file.");
		}
	}
}
