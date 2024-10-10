package com.bookstorerest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc
public class WebLayerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  public void testDefaultMessage() throws Exception {
    this.mockMvc.perform(get("/booklist")).andDo(print()).andExpect(status().isOk())
        .andExpect(content().string(containsString("Hello World!")));
    System.out.println("Running testDefaultMessage...");

  }

  @Test
  public void failingTest() throws Exception {
    System.out.println("Running failing test...");
    assertThat(false).isTrue(); // This will fail and output a stack trace
  }

  @WithMockUser
  @Test
  public void shouldReturnBookList() throws Exception {
    this.mockMvc.perform(get("/books"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"));
    System.out.println("Running shouldReturnBookList...");
  }
}
