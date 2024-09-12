package com.database.partone.domain;

import org.springframework.data.repository.CrudRepository;
import java.util.List;

public interface BookRepository extends CrudRepository<Book, Long> {
  List<Book> findByAuthor(String author);
}
