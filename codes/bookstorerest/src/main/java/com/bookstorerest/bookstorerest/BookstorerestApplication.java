package com.bookstorerest.bookstorerest;

import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookstorerestApplication {

	public static void main(String[] args) {
		SpringApplication.run(BookstorerestApplication.class, args);
		List<String> list = findByAuthor("J.K. Rowling");
	}

	public static List<String> findByAuthor(String author) {
		// Dummy implementation for demonstration purposes
		return List.of("Book 1", "Book 2", "Book 3");
	}
}
