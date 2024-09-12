package com.database.parttwo.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;

import com.database.parttwo.domain.Book;
import com.database.parttwo.domain.BookRepository;
import com.database.parttwo.domain.Category;
import com.database.parttwo.domain.CategoryRepository;

@Controller
public class BookController {

  private final BookRepository bookRepository;
  private final CategoryRepository categoryRepository;

  public BookController(BookRepository bookRepository, CategoryRepository categoryRepository) {
    this.bookRepository = bookRepository;
    this.categoryRepository = categoryRepository;
  }

  @GetMapping("/booklist")
  public String bookList(Model model) {
    model.addAttribute("books", bookRepository.findAll());
    return "booklist";
  }

  @GetMapping("/addbook")
  public String addBookForm(Model model) {
    model.addAttribute("categories", categoryRepository.findAll());
    model.addAttribute("book", new Book());
    return "addbook";
  }

  @PostMapping("/addbook")
  public String addBook(Book book, @RequestParam Long categoryId) {
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new IllegalArgumentException("Invalid category Id:" + categoryId));
    book.setCategory(category);
    bookRepository.save(book);
    return "redirect:/booklist";
  }

  @GetMapping("/delete/{id}")
  public String deleteBook(@PathVariable("id") Long id) {
    bookRepository.deleteById(id);
    return "redirect:/booklist";
  }

  @GetMapping("/edit/{id}")
  public String editBook(@PathVariable("id") Long id, Model model) {
    Book book = bookRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Invalid book Id:" + id));
    model.addAttribute("book", book);
    model.addAttribute("categories", categoryRepository.findAll());
    return "editbook";
  }

  @PostMapping("/edit/{id}")
  public String updateBook(@PathVariable("id") Long id, Book book, @RequestParam Long categoryId) {
    book.setId(id);
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new IllegalArgumentException("Invalid category Id:" + categoryId));
    book.setCategory(category);
    bookRepository.save(book);
    return "redirect:/booklist";
  }
}
