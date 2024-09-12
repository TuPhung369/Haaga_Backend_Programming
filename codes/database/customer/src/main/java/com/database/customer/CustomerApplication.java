package com.database.customer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.database.customer.domain.Customer;
import com.database.customer.domain.CustomerDAOImpl;

@SpringBootApplication
public class CustomerApplication {

	private static final Logger log = LoggerFactory.getLogger(CustomerApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(CustomerApplication.class, args);
	}

	@Bean
	public CommandLineRunner demo(CustomerDAOImpl customerDAO) {
		return (args) -> {

			// Insert some demo data
			log.info("Inserting demo data into the database");
			customerDAO.save(new Customer("John", "Johnson@gmail.com"));
			// customerDAO.save(new Customer("Mike", "Mars@gmail.com"));
			// customerDAO.save(new Customer("Kate", "JohnHot@gmail.com"));

		};
	}
}
