package com.bookstorerest.bookstorerest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.bookstorerest.bookstorerest.domain.Book;
import com.bookstorerest.bookstorerest.domain.BookStoreRepository;
import com.bookstorerest.bookstorerest.domain.Category;
import com.bookstorerest.bookstorerest.domain.CategoryRepository;

@SpringBootApplication
public class BookstorerestApplication {
	private static final Logger log = LoggerFactory.getLogger(BookstorerestApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(BookstorerestApplication.class, args);
	}

	@Bean
	public CommandLineRunner bookDemo(BookStoreRepository brepository, CategoryRepository crepository) {
		return (args) -> {
			log.info("Saving categories if they don't exist");
			if (crepository.findByName("Fiction").isEmpty()) {
				crepository.save(new Category("Fiction"));
			}
			if (crepository.findByName("Non-Fiction").isEmpty()) {
				crepository.save(new Category("Non-Fiction"));
			}
			if (crepository.findByName("Science Fiction").isEmpty()) {
				crepository.save(new Category("Science Fiction"));
			}

			log.info("Saving books");
			if (brepository.findByTitle("The Lord of the Rings").isEmpty()) {
				brepository.save(new Book("The Lord of the Rings", "J.R.R. Tolkien", crepository.findByName("Fiction").get(0)));
			}
			if (brepository.findByTitle("To Kill a Mockingbird").isEmpty()) {
				brepository.save(new Book("To Kill a Mockingbird", "Harper Lee", crepository.findByName("Non-Fiction").get(0)));
			}
			if (brepository.findByTitle("The Hitchhiker's Guide to the Galaxy").isEmpty()) {
				brepository.save(new Book("The Hitchhiker's Guide to the Galaxy", "Douglas Adams",
						crepository.findByName("Science Fiction").get(0)));
			}

			log.info("Fetching all books");
			for (Book book : brepository.findAll()) {
				log.info(book.toString());
			}
		};
	}

}
