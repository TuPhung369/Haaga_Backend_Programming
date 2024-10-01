package com.bookstorerest.domain;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

public interface BookStoreRepository extends CrudRepository<Book, Long> {
  List<Book> findByTitle(String title);
  // Repository methods here
}
