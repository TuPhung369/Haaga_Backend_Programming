package com.database.partone.web;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.beans.factory.annotation.Autowired;
import com.database.partone.domain.Book;
import com.database.partone.domain.BookRepository;

@Controller
public class BookController {

  @Autowired
  private final BookRepository repository;

  // Constructor injection
  public BookController(BookRepository repository) {
    this.repository = repository;
  }

  // Displays the list of books
  @GetMapping("/booklist")
  public String bookList(Model model) {
    model.addAttribute("books", repository.findAll());
    return "booklist"; // Returns the book list view
  }

  // Show the form to add a new book (GET request)
  @GetMapping("/addbook")
  public String showAddBookForm(Model model) {
    model.addAttribute("book", new Book()); // Adding an empty Book object to the model
    return "addbook"; // Returning the addbook.html template
  }

  // Handles the submission of the add book form (POST request)
  @PostMapping("/addbook")
  public String addBook(@ModelAttribute Book book) {
    repository.save(book); // Save the new book
    return "redirect:/booklist"; // Redirect to the book list after saving
  }

  // Handles deleting a book by ID
  @GetMapping("/delete/{id}")
  public String deleteBook(@PathVariable("id") Long id) {
    repository.deleteById(id); // Deletes the book by its ID
    return "redirect:/booklist"; // Redirect to the book list after deletion
  }

  // Show the edit form for a book by its ID (GET request)
  @GetMapping("/edit/{id}")
  public String showEditBookForm(@PathVariable("id") Long id, Model model) {
    Book book = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Invalid book Id:" + id)); // Fetch the book to edit
    model.addAttribute("book", book); // Add the existing book to the model
    return "editbook"; // Return the edit book view
  }

  // Handles updating a book (POST request)
  @PostMapping("/edit/{id}")
  public String updateBook(@PathVariable("id") Long id, @ModelAttribute Book book) {
    book.setId(id); // Set the book ID to ensure the correct book is updated
    repository.save(book); // Save the updated book
    return "redirect:/booklist"; // Redirect to the book list after update
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
