package com.database.study;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//Ensure that the PasswordEncoder bean is properly initialized. You’ve already placed the SecurityConfig in Security package.
@SpringBootApplication(scanBasePackages = { "com.database.study" })
public class StudyApplication {
	private static final Logger log = LoggerFactory.getLogger(StudyApplication.class);

	public static void main(String[] args) {
		log.info("Starting StudyApplication...");
		log.debug("Debug log for testing purposes...");
		SpringApplication.run(StudyApplication.class, args);
	}

}
