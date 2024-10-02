package com.bookstorerest.web;

import java.util.List;
import java.util.Optional;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.bookstorerest.domain.Book;
import com.bookstorerest.domain.BookStoreRepository;
import com.bookstorerest.domain.User;
import com.bookstorerest.domain.UserRepository;
import com.bookstorerest.domain.Category;
import com.bookstorerest.domain.CategoryRepository;

@Controller
public class BookStoreController {

  @Autowired
  private BookStoreRepository repository;

  @Autowired
  private CategoryRepository categoryRepository;

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
    model.addAttribute("categories", categoryRepository.findAll());
    return "addBookForm";
  }

  @PostMapping("/save")
  public ResponseEntity<String> saveBook(@Valid @ModelAttribute("book") Book book,
      BindingResult bindingResult,
      Model model) {

    // Check for validation errors
    if (bindingResult.hasErrors()) {
      // Gather error messages
      StringBuilder errorMessage = new StringBuilder("Please fix the following errors:<br>");
      bindingResult.getFieldErrors().forEach(error -> errorMessage.append(error.getDefaultMessage()).append("<br>"));
      return ResponseEntity.badRequest().body(errorMessage.toString());
    }

    // Ensure the category ID is present and valid
    if (book.getCategory() == null || book.getCategory().getCategoryId() == null) {
      return ResponseEntity.badRequest().body("Category must be selected");
    }

    // Check if the category exists in the repository
    Category category = categoryRepository.findById(book.getCategory().getCategoryId())
        .orElseThrow(() -> new IllegalArgumentException("Invalid category ID: " + book.getCategory().getCategoryId()));

    book.setCategory(category); // Set the full Category object on the Book

    // Save the book if valid
    repository.save(book);

    return ResponseEntity.ok("Book saved successfully!");
  }

  // Save new book via REST API
  @RequestMapping(value = "/createBook", method = RequestMethod.POST)
  public @ResponseBody Book createBook(@RequestBody Book book) {
    return repository.save(book);
  }

  // Show form to edit an existing book
  @RequestMapping(value = "/edit/{id}", method = RequestMethod.GET)
  public String showEditBookForm(@PathVariable("id") Long bookId, Model model) {
    Optional<Book> book = repository.findById(bookId);
    if (!book.isPresent()) {
      model.addAttribute("errorMessage", "Book not found");
      return "error";
    }
    model.addAttribute("book", book.get());
    model.addAttribute("categories", categoryRepository.findAll());
    return "editBookForm"; // This should be your edit form template
  }

  @RequestMapping(value = "/edit/{id}", method = RequestMethod.POST)
  public String saveEditedBook(@Valid Book book, BindingResult result, Model model) {
    if (result.hasErrors()) {
      model.addAttribute("categories", categoryRepository.findAll());
      return "editBookForm"; // Return to the form with errors
    }
    repository.save(book); // Save the updated book
    return "redirect:/booklist";
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
