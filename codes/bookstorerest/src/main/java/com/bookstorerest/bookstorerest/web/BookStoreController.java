package com.bookstorerest.bookstorerest.web;

import com.bookstorerest.bookstorerest.domain.Book;
import com.bookstorerest.bookstorerest.domain.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

public class BookStoreController {
  // Get book by ID in JSON format
  @GetMapping("/api/books/{id}")
  public ResponseEntity<Book> getBookById(@PathVariable Long id) {
    return repository.findById(id)
        .map(book -> ResponseEntity.ok().body(book))
        .orElse(ResponseEntity.notFound().build());
  }

}
