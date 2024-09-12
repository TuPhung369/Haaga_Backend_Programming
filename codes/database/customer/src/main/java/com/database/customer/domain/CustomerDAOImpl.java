package com.database.customer.domain;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class CustomerDAOImpl implements CustomerDAO {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Transactional
	@Override
	public void save(Customer customer) {
		if (customer.getId() == null || customer.getId() == 0) {
			// Insert new customer (ID is not set or is 0)
			String sql = "INSERT INTO customer (name, email) VALUES (?, ?)";
			//System.out.println("Inserting New Customer: " + sql);
			jdbcTemplate.update(sql, customer.getName(), customer.getEmail());
		} else {
			// Update existing customer
			String sql = "UPDATE customer SET name = ?, email = ? WHERE id = ?";
			//System.out.println("Updating Customer: " + sql);
			jdbcTemplate.update(sql, customer.getName(), customer.getEmail(), customer.getId());
		}
	}

	@Override
	public Customer findOne(int id) {
		String sql = "SELECT id, name, email FROM customer WHERE id = ?";
		return jdbcTemplate.queryForObject(sql, new CustomerRowMapper(), id);
	}

	@Override
	public List<Customer> findAll() {
		// Debugging: Log the SQL query for fetching customers
		String sql = "SELECT id, name, email FROM customer";
		//System.out.println("Fetching all customers with SQL: " + sql);

		List<Customer> customers = jdbcTemplate.query(sql, new CustomerRowMapper());

		// Debugging: Print the list of customers retrieved
		for (Customer customer : customers) {
			System.out.println(
					"Customer: ID=" + customer.getId() + ", Name=" + customer.getName() + ", Email=" + customer.getEmail());
		}

		return customers; // Return the list of customers
	}

	@Override
	public boolean existsById(Long id) {
		String sql = "SELECT COUNT(*) FROM customer WHERE id = ?";
		Integer count = jdbcTemplate.queryForObject(sql, Integer.class, id);
		return count != null && count > 0;
	}

	@Override
	public void deleteById(Long id) {
		String sql = "DELETE FROM customer WHERE id = ?";
		jdbcTemplate.update(sql, id);
	}
}
