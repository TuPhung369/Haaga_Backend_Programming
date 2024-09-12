package com.database.partone;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.database.partone.domain.Book;
import com.database.partone.domain.BookRepository;

@SpringBootApplication
public class PartOneApplication {
    private static final Logger log = LoggerFactory.getLogger(PartOneApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(PartOneApplication.class, args);
    }

    @Bean
    public CommandLineRunner bookDemo(BookRepository repository) {
        return (args) -> {
            log.info("save a couple of books");
            repository.save(new Book("Ernest Hemingway", "A Farewell to Arms", "1232323-21", "1929"));
            repository.save(new Book("George Orwell", "Animal Farm", "2212343-5", "1945"));

            log.info("fetch all books");
            for (Book book : repository.findAll()) {
                log.info(book.toString());
            }
        };
    }
}
