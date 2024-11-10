package com.database.study;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//Ensure that the PasswordEncoder bean is properly initialized. You’ve already placed the SecurityConfig in Security package.
@Slf4j
@SpringBootApplication(scanBasePackages = { "com.database.study" })
public class StudyApplication {

	public static void main(String[] args) {
		// log.info("Starting StudyApplication...");
		// log.debug("Debug log for testing purposes...");
		SpringApplication.run(StudyApplication.class, args);
	}

}
