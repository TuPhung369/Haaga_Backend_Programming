package com.database.partone.web;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.database.partone.domain.Book;
import com.database.partone.domain.BookRepository;

@Controller
public class BookController {

  private final BookRepository repository;

  public BookController(BookRepository repository) {
    this.repository = repository;
  }

  @GetMapping("/booklist")
  public String bookList(Model model) {
    model.addAttribute("books", repository.findAll());
    return "booklist";
  }

  @PostMapping("/addbook")
  public String addBook(Book book) {
    repository.save(book);
    return "redirect:/booklist";
  }

  @GetMapping("/delete/{id}")
  public String deleteBook(@PathVariable("id") Long id) {
    repository.deleteById(id);
    return "redirect:/booklist";
  }

  @GetMapping("/edit/{id}")
  public String editBook(@PathVariable("id") Long id, Model model) {
    Book book = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Invalid book Id:" + id));
    model.addAttribute("book", book);
    return "editbook";
  }

  @PostMapping("/edit/{id}")
  public String updateBook(@PathVariable("id") Long id, Book book) {
    book.setId(id);
    repository.save(book);
    return "redirect:/booklist";
  }
}
