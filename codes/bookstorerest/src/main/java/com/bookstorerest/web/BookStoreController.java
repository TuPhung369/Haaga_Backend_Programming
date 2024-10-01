package com.bookstorerest.web;

import java.util.List;
import java.util.Optional;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.bookstorerest.domain.Book;
import com.bookstorerest.domain.User;
import com.bookstorerest.domain.UserRepository;
import com.bookstorerest.domain.BookStoreRepository;
import com.bookstorerest.domain.CategoryRepository;

@Controller
public class BookStoreController {

  @Autowired
  private BookStoreRepository repository;

  @Autowired
  private CategoryRepository crepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserRepository userRepository;

  // Show all books in the list
  @RequestMapping(value = "/booklist", method = RequestMethod.GET)
  public String bookList(Model model) {
    model.addAttribute("books", repository.findAll());
    return "bookListView"; // Ensure this matches the HTML file name
  }

  // RESTful service to get all books
  @RequestMapping(value = "/books", method = RequestMethod.GET)
  public @ResponseBody List<Book> bookListRest() {
    return (List<Book>) repository.findAll();
  }

  // RESTful service to get book by id
  @RequestMapping(value = "/book/{id}", method = RequestMethod.GET)
  public @ResponseBody Optional<Book> findBookRest(@PathVariable("id") Long bookId) {
    return repository.findById(bookId);
  }

  // Show form to add a new book
  @RequestMapping(value = "/add", method = RequestMethod.GET)
  public String showAddBookForm(Model model) {
    model.addAttribute("book", new Book());
    model.addAttribute("categories", crepository.findAll());
    return "addBookForm";
  }

  // Save new book from form
  @RequestMapping(value = "/save", method = RequestMethod.POST)
  public String save(@Valid Book book, BindingResult result, Model model) {
    if (result.hasErrors()) {
      model.addAttribute("categories", crepository.findAll());
      return "addBookForm"; // return the form with errors
    }
    repository.save(book);
    return "redirect:/booklist";
  }

  // Save new book via REST API
  @RequestMapping(value = "/createBook", method = RequestMethod.POST)
  public @ResponseBody Book createBook(@RequestBody Book book) {
    return repository.save(book);
  }

  // Delete book by ID
  @RequestMapping(value = "/delete/{id}", method = RequestMethod.GET)
  @PreAuthorize("hasRole('ADMIN')")
  public String deleteBook(@PathVariable("id") Long bookId, Model model) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    System.out.println("Authenticated user: " + authentication.getName());
    System.out.println("User roles: " + authentication.getAuthorities());

    Optional<Book> book = repository.findById(bookId);
    if (!book.isPresent()) {
      model.addAttribute("errorMessage", "Book not found");
      return "error";
    }
    repository.deleteById(bookId);
    return "redirect:/booklist";
  }

  // Save user with hashed password
  public void saveUser(User user) {
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    userRepository.save(user);
  }

  // Show login page
  @RequestMapping(value = "/login", method = RequestMethod.GET)
  public String showLoginPage() {
    return "login"; // Ensure this matches your login.html template
  }
}
