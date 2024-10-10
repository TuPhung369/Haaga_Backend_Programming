package com.bookstorerest;

import com.bookstorerest.domain.Book;
import com.bookstorerest.domain.Category;
import com.bookstorerest.domain.BookStoreRepository;
import com.bookstorerest.web.BookStoreController;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.Optional;

@WebMvcTest(BookStoreController.class)
public class BookStoreControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private BookStoreRepository bookRepository;

  // Test to get all books
  @Test
  public void testGetAllBooks() throws Exception {
    Book book1 = new Book("Title1", "Author1", new Category("Fiction"));
    Book book2 = new Book("Title2", "Author2", new Category("Science"));
    Mockito.when(bookRepository.findAll()).thenReturn(Arrays.asList(book1, book2));

    mockMvc.perform(get("/books"))
        .andExpect(status().isOk())
        .andExpect(content().json("[{'title':'Title1','author':'Author1'},{'title':'Title2','author':'Author2'}]"));
  }

  // Test to get book by ID
  @Test
  public void testGetBookById() throws Exception {
    Book book = new Book("Title1", "Author1", new Category("Fiction"));
    Mockito.when(bookRepository.findById(1L)).thenReturn(Optional.of(book));

    mockMvc.perform(get("/book/1"))
        .andExpect(status().isOk())
        .andExpect(content().json("{'title':'Title1','author':'Author1'}"));
  }

  // Test to create a new book
  @Test
  public void testCreateBook() throws Exception {
    Book book = new Book("New Title", "New Author", new Category("Fiction"));
    Mockito.when(bookRepository.save(Mockito.any(Book.class))).thenReturn(book);

    mockMvc.perform(post("/createBook")
        .contentType(MediaType.APPLICATION_JSON)
        .content(
            "{ \"title\": \"New Title\", \"author\": \"New Author\", \"category\": { \"categoryId\": 1, \"name\": \"Fiction\" } }"))
        .andExpect(status().isOk())
        .andExpect(content().json("{'title':'New Title','author':'New Author'}"));
  }

  // Test to show add book form
  @Test
  public void testShowAddBookForm() throws Exception {
    mockMvc.perform(get("/add"))
        .andExpect(status().isOk());
  }

  // Test to show edit book form
  @Test
  public void testShowEditBookForm() throws Exception {
    Book book = new Book("Title1", "Author1", new Category("Fiction"));
    Mockito.when(bookRepository.findById(1L)).thenReturn(Optional.of(book));

    mockMvc.perform(get("/edit/1"))
        .andExpect(status().isOk())
        .andExpect(content().json("{'title':'Title1','author':'Author1'}"));
  }

  // Test to save edited book
  @Test
  public void testSaveEditedBook() throws Exception {
    Book book = new Book("Edited Title", "Edited Author", new Category("Fiction"));
    Mockito.when(bookRepository.save(Mockito.any(Book.class))).thenReturn(book);

    mockMvc.perform(post("/edit/1")
        .contentType(MediaType.APPLICATION_JSON)
        .content(
            "{ \"title\": \"Edited Title\", \"author\": \"Edited Author\", \"category\": { \"categoryId\": 1, \"name\": \"Fiction\" } }"))
        .andExpect(status().is3xxRedirection());
  }

  // Test to delete a book
  @Test
  public void testDeleteBook() throws Exception {
    Book book = new Book("Title1", "Author1", new Category("Fiction"));
    Mockito.when(bookRepository.findById(1L)).thenReturn(Optional.of(book));

    mockMvc.perform(get("/delete/1"))
        .andExpect(status().is3xxRedirection());
  }
}
