package com.database.study;

import lombok.extern.slf4j.Slf4j;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//Ensure that the PasswordEncoder bean is properly initialized. You’ve already placed the SecurityConfig in Security package.
@Slf4j
@SpringBootApplication(scanBasePackages = { "com.database.study" })
public class StudyApplication {

	public static void main(String[] args) {
		// Load environment variables from .env file
		Dotenv dotenv = Dotenv.configure().load();

		if (dotenv == null) {
			System.out.println("Dotenv failed to load the .env file.");
			return; // Exit or handle accordingly
		}

		// Debugging output
		String dbUrl = dotenv.get("DB_URL");
		String dbUsername = dotenv.get("DB_USERNAME");
		String dbPassword = dotenv.get("DB_PASSWORD");
		String baseUrl = dotenv.get("BASE_URL");
		String oauthClientId = dotenv.get("OAUTH_CLIENT_ID");
		String oauthClientSecret = dotenv.get("OAUTH_CLIENT_SECRET");

		// Handle null values if needed (optional)
		if (dbUrl == null || dbUsername == null || dbPassword == null) {
			System.out.println("Required environment variables are missing");
			// Handle appropriately, e.g., exit or use default values
		} else {
			System.out.println("Loaded DB_URL: " + dbUrl);
		}

		// Set system properties from environment variables
		System.setProperty("DB_URL", dbUrl);
		System.setProperty("DB_USERNAME", dbUsername);
		System.setProperty("DB_PASSWORD", dbPassword);
		System.setProperty("BASE_URL", baseUrl);
		System.setProperty("OAUTH_CLIENT_ID", oauthClientId);
		System.setProperty("OAUTH_CLIENT_SECRET", oauthClientSecret);

		SpringApplication.run(StudyApplication.class, args);
	}
}
