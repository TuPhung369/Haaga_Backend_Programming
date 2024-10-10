package com.bookstorerest;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import com.bookstorerest.domain.BookStoreRepository;
import com.bookstorerest.domain.CategoryRepository;
import com.bookstorerest.domain.UserRepository;
import com.bookstorerest.domain.Book;
import com.bookstorerest.domain.Category;
import com.bookstorerest.domain.User;

import java.util.Optional;

@DataJpaTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb"
})
public class BookStoreRepositoryTest {

  @Autowired
  private BookStoreRepository bookRepository;

  @Autowired
  private CategoryRepository categoryRepository;

  @Autowired
  private UserRepository userRepository;

  private Category category;

  @BeforeEach
  public void setUp() {
    // Create and save a category before each test
    category = categoryRepository.save(new Category("Fiction"));
  }

  @Test
  public void testCreateBook() {
    Book book = new Book("Test Title", "Test Author", category);
    bookRepository.save(book);

    assertThat(book.getId()).isNotNull(); // Verify book is saved and ID is generated
  }

  @Test
  public void testFindBookById() {
    Book book = new Book("Test Title", "Test Author", category);
    book = bookRepository.save(book); // Save the book to generate ID

    Optional<Book> foundBook = bookRepository.findById(book.getId());
    assertThat(foundBook).isPresent(); // Ensure the book is found
    assertThat(foundBook.get().getTitle()).isEqualTo("Test Title"); // Verify the title
  }

  @Test
  public void testFindAllBooks() {
    Book book1 = new Book("Test Title 1", "Test Author 1", category);
    Book book2 = new Book("Test Title 2", "Test Author 2", category);
    bookRepository.save(book1);
    bookRepository.save(book2);

    assertThat(bookRepository.findAll()).hasSize(2); // Verify there are 2 books saved
  }

  @Test
  public void testDeleteBook() {
    Book book = new Book("Test Title", "Test Author", category);
    book = bookRepository.save(book); // Save the book to generate ID

    bookRepository.delete(book); // Delete the book
    Optional<Book> foundBook = bookRepository.findById(book.getId());
    assertThat(foundBook).isNotPresent(); // Ensure the book is deleted
  }

  @Test
  public void testCreateUser() {
    User user = new User();
    user.setUsername("john_doe");
    user.setPassword("password123");
    user.setEmail("john@example.com");
    user.setRole("USER");
    userRepository.save(user);

    assertThat(user.getUsername()).isNotNull(); // Verify user is saved and username is set
  }

  @Test
  public void testFindUserByUsername() {
    User user = new User();
    user.setUsername("john_doe");
    user.setPassword("password123");
    user.setEmail("john@example.com");
    user.setRole("USER");
    user = userRepository.save(user); // Save the user to generate entry

    User foundUser = userRepository.findByUsername(user.getUsername());
    assertThat(foundUser).isNotNull(); // Ensure the user is found
    assertThat(foundUser.getEmail()).isEqualTo("john@example.com"); // Verify the email
  }

  @Test
  public void testFindAllUsers() {
    User user1 = new User();
    user1.setUsername("john_doe");
    user1.setPassword("password123");
    user1.setEmail("john@example.com");
    user1.setRole("USER");

    User user2 = new User();
    user2.setUsername("jane_smith");
    user2.setPassword("password456");
    user2.setEmail("jane@example.com");
    user2.setRole("USER");

    userRepository.save(user1);
    userRepository.save(user2);

    // Verify there are 2 users saved
    assertThat(userRepository.findAll()).hasSize(2);
  }

  @Test
  public void testDeleteUser() {
    User user = new User();
    user.setUsername("john_doe");
    user.setPassword("password123");
    user.setEmail("john@example.com");
    user.setRole("USER");
    user = userRepository.save(user); // Save the user to generate entry

    userRepository.delete(user); // Delete the user
    Optional<User> foundUser = userRepository.findById(user.getUsername());
    assertThat(foundUser).isNotPresent(); // Ensure the user is deleted
  }
}
