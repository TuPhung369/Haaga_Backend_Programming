package com.database.parttwo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.database.parttwo.domain.Book;
import com.database.parttwo.domain.BookRepository;
import com.database.parttwo.domain.Category;
import com.database.parttwo.domain.CategoryRepository;

@SpringBootApplication
public class PartTwoApplication {
    private static final Logger log = LoggerFactory.getLogger(PartTwoApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(PartTwoApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(BookRepository bookRepository, CategoryRepository categoryRepository) {
        return args -> {
            log.info("save a couple of categories");
            Category fiction = new Category();
            fiction.setName("Fiction");
            categoryRepository.save(fiction);

            Category nonFiction = new Category();
            nonFiction.setName("Non-Fiction");
            categoryRepository.save(nonFiction);

            bookRepository.save(new Book("Ernest Hemingway", "A Farewell to Arms", "1232323-21", "1929", fiction));
            bookRepository.save(new Book("George Orwell", "Animal Farm", "2212343-5", "1945", nonFiction));

            log.info("fetch all books");
            bookRepository.findAll().forEach(book -> log.info(book.toString()));
        };
    }
}
