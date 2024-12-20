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
		Dotenv dotenv = Dotenv.configure()
				.filename(".env") // Specify the file name
				.load();

		if (dotenv == null) {
			System.err.println("Dotenv failed to load the .env file.");
			return; // Exit application
		}

		// Load and validate environment variables
		String dbUrlDev = dotenv.get("DB_URL_DEV");
		String dbUsernameDev = dotenv.get("DB_USERNAME_DEV");
		String dbPasswordDev = dotenv.get("DB_PASSWORD_DEV");

		String dbUrlGoogle = dotenv.get("DB_URL_GOOGLE");
		String dbUsernameGoogle = dotenv.get("DB_USERNAME_GOOGLE");
		String dbPasswordGoogle = dotenv.get("DB_PASSWORD_GOOGLE");

		String dbUrlAws = dotenv.get("DB_URL_AWS");
		String dbUsernameAws = dotenv.get("DB_USERNAME_AWS");
		String dbPasswordAws = dotenv.get("DB_PASSWORD_AWS");

		String oauth2ClientId = dotenv.get("OAUTH2_CLIENT_ID");
		String oauth2ClientSecret = dotenv.get("OAUTH2_CLIENT_SECRET");

		String desktopClientId = dotenv.get("DESKTOP_CLIENT_ID");
		String desktopClientSecret = dotenv.get("DESKTOP_CLIENT_SECRET");

		String githubClientId = dotenv.get("GITHUB_CLIENT_ID");
		String githubClientSecret = dotenv.get("GITHUB_CLIENT_SECRET");

		String baseUrl = dotenv.get("BASE_URL");

		String oauth2RedirectUri = dotenv.get("OAUTH2_REDIRECT_URI");
		String githubRedirectUri = dotenv.get("GITHUB_REDIRECT_URI");

		String appBaseUri = dotenv.get("APP_BASE_URI");
		String clientRedirectUri = dotenv.get("CLIENT_REDIRECT_URI");
		String clientGitRedirectUri = dotenv.get("CLIENT_GIT_REDIRECT_URI");

		if (dbUrlGoogle == null || dbUsernameGoogle == null || dbPasswordGoogle == null || oauth2ClientId == null
				|| oauth2ClientSecret == null || dbUrlAws == null || dbUsernameAws == null || dbPasswordAws == null) {
			System.err.println("Required environment variables are missing. Please check your .env file.");
			return; // Exit application
		}

		// Set system properties from environment variables
		setSystemProperty("DB_URL_DEV", dbUrlDev);
		setSystemProperty("DB_USERNAME_DEV", dbUsernameDev);
		setSystemProperty("DB_PASSWORD_DEV", dbPasswordDev);

		setSystemProperty("DB_URL_GOOGLE", dbUrlGoogle);
		setSystemProperty("DB_USERNAME_GOOGLE", dbUsernameGoogle);
		setSystemProperty("DB_PASSWORD_GOOGLE", dbPasswordGoogle);

		setSystemProperty("DB_URL_AWS", dbUrlAws);
		setSystemProperty("DB_USERNAME_AWS", dbUsernameAws);
		setSystemProperty("DB_PASSWORD_AWS", dbPasswordAws);

		setSystemProperty("OAUTH2_CLIENT_ID", oauth2ClientId);
		setSystemProperty("OAUTH2_CLIENT_SECRET", oauth2ClientSecret);

		setSystemProperty("DESKTOP_CLIENT_ID", desktopClientId);
		setSystemProperty("DESKTOP_CLIENT_SECRET", desktopClientSecret);

		setSystemProperty("GITHUB_CLIENT_ID", githubClientId);
		setSystemProperty("GITHUB_CLIENT_SECRET", githubClientSecret);

		setSystemProperty("BASE_URL", baseUrl);

		setSystemProperty("OAUTH2_REDIRECT_URI", oauth2RedirectUri);
		setSystemProperty("GITHUB_REDIRECT_URI", githubRedirectUri);

		setSystemProperty("APP_BASE_URI", appBaseUri);
		setSystemProperty("CLIENT_REDIRECT_URI", clientRedirectUri);
		setSystemProperty("CLIENT_GIT_REDIRECT_URI", clientGitRedirectUri);

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
