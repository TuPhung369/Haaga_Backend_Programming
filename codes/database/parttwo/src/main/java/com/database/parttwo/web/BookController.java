package com.database.parttwo.web;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import com.database.parttwo.domain.Book;
import com.database.parttwo.domain.BookRepository;
import com.database.parttwo.domain.Category;
import com.database.parttwo.domain.CategoryRepository;

@Controller
public class BookController {

  @Autowired
  private final BookRepository bookRepository;

  @Autowired
  private final CategoryRepository categoryRepository;

  // Constructor injection
  public BookController(BookRepository bookRepository, CategoryRepository categoryRepository) {
    this.bookRepository = bookRepository;
    this.categoryRepository = categoryRepository;
  }

  // Displays the list of books
  @GetMapping("/booklist")
  public String bookList(Model model) {
    model.addAttribute("books", bookRepository.findAll());
    return "booklist"; // Returns the book list view
  }

  // Show the form to add a new book (GET request)
  @GetMapping("/addbook")
  public String showAddBookForm(Model model) {
    model.addAttribute("categories", categoryRepository.findAll());
    model.addAttribute("book", new Book()); // Adding an empty Book object to the model
    return "addbook"; // Returning the addbook.html template
  }

  // Handles the submission of the add book form (POST request)
  @PostMapping("/addbook")
  public String addBook(@ModelAttribute Book book, @RequestParam("categoryId") Long categoryId) {
    // Ensure the categoryId is present and valid
    if (categoryId == null) {
      throw new IllegalArgumentException("Category ID is missing");
    }

    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new IllegalArgumentException("Invalid category ID: " + categoryId));

    book.setCategory(category);
    bookRepository.save(book); // Save the new book

    return "redirect:/booklist"; // Redirect to the book list after saving
  }

  // Handles deleting a book by ID
  @GetMapping("/delete/{id}")
  public String deleteBook(@PathVariable("id") Long id) {
    bookRepository.deleteById(id); // Deletes the book by its ID
    return "redirect:/booklist"; // Redirect to the book list after deletion
  }

  // Show the edit form for a book by its ID (GET request)
  @GetMapping("/edit/{id}")
  public String showEditBookForm(@PathVariable("id") Long id, Model model) {
    Book book = bookRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Invalid book Id:" + id)); // Fetch the book to edit
    model.addAttribute("book", book); // Add the existing book to the model
    model.addAttribute("categories", categoryRepository.findAll());
    return "editbook"; // Return the edit book view
  }

  // Handles updating a book (POST request)
  @PostMapping("/edit/{id}")
  public String updateBook(@PathVariable("id") Long id, @ModelAttribute Book book, @RequestParam Long categoryId) {
    book.setId(id); // Set the book ID to ensure the correct book is updated
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new IllegalArgumentException("Invalid category Id:" + categoryId));
    book.setCategory(category);
    bookRepository.save(book); // Save the updated book
    return "redirect:/booklist"; // Redirect to the book list after update
  }
}