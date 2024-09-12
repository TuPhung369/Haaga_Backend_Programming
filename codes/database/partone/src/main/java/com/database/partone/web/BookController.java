package com.database.partone.web;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.beans.factory.annotation.Autowired;

import com.database.partone.domain.Book;
import com.database.partone.domain.BookRepository;

@Controller
public class BookController {
  @Autowired // This annotation uses the constructor to inject the BookRepository object
  private BookRepository repository;

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

// package com.database.partone.web;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Controller;
// import org.springframework.ui.Model;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestMethod;

// import com.database.partone.domain.Book;
// import com.database.partone.domain.BookRepository;

// @Controller
// public class BookController {

// @Autowired
// private BookRepository repository;

// public BookController(BookRepository repository) {
// this.repository = repository;
// }

// // Handles both "/" and "/booklist" paths
// @RequestMapping(value = { "/", "/booklist" }, method = RequestMethod.GET)
// public String bookList(Model model) {
// model.addAttribute("books", repository.findAll());
// return "booklist";
// }

// // Handles POST request for adding a book
// @RequestMapping(value = "/addbook", method = RequestMethod.POST)
// public String addBook(Book book) {
// repository.save(book);
// return "redirect:/booklist";
// }

// // Handles GET request for deleting a book by its ID
// @RequestMapping(value = "/delete/{id}", method = RequestMethod.GET)
// public String deleteBook(@PathVariable("id") Long id) {
// repository.deleteById(id);
// return "redirect:/booklist";
// }

// // Handles GET request to load book details for editing
// @RequestMapping(value = "/edit/{id}", method = RequestMethod.GET)
// public String editBook(@PathVariable("id") Long id, Model model) {
// Book book = repository.findById(id).orElseThrow(() -> new
// IllegalArgumentException("Invalid book Id:" + id));
// model.addAttribute("book", book);
// return "editbook";
// }

// // Handles POST request for updating a book
// @RequestMapping(value = "/edit/{id}", method = RequestMethod.POST)
// public String updateBook(@PathVariable("id") Long id, Book book) {
// book.setId(id);
// repository.save(book);
// return "redirect:/booklist";
// }
// }
