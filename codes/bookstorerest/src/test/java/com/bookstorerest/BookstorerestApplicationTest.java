package com.bookstorerest;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.bookstorerest.web.BookStoreController;

@SpringBootTest
class BookstorerestApplicationTest {

	@Autowired
	private BookStoreController bookController;

	@Test
	public void contextLoads() throws Exception {
		System.out.println("Context loading...");
		assertThat(bookController).isNotNull();
		System.out.println("Controller is not null!");
	}

}
