package com.database.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//Ensure that the PasswordEncoder bean is properly initialized. You’ve already placed the SecurityConfig in Security package.
@SpringBootApplication(scanBasePackages = { "com.database.study" })
public class StudyApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudyApplication.class, args);
	}

}
