package com.database.partone;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync; // Add this import statement

import com.database.partone.domain.Book;
import com.database.partone.domain.BookRepository;

@EnableAsync
@SpringBootApplication
public class PartOneApplication {
    private static final Logger log = LoggerFactory.getLogger(PartOneApplication.class);

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = SpringApplication.run(PartOneApplication.class, args)) {
            log.trace("context: " + context);
        }
    }

    @Bean
    public CommandLineRunner bookDemo(BookRepository repository) {
        return (args) -> {
            log.info("save a couple of books");
            repository.save(new Book("Ernest Hemingway", "A Farewell to Arms", "1232323-21", "1929"));
            repository.save(new Book("George Orwell", "Animal Farm", "2212343-5", "1945"));

            log.info("fetch all books");
            repository.findAll().forEach(book -> log.info(book.toString()));
        };
    }
}
