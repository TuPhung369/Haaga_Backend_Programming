package com.database.customer.domain;

import java.sql.ResultSet;
import java.sql.SQLException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.lang.NonNull;

public class CustomerRowMapper implements RowMapper<Customer> {

	@Override
	public Customer mapRow(@NonNull ResultSet rs, int rowNum) throws SQLException {
		Customer customer = new Customer();
		customer.setId(rs.getLong("id")); // Ensure column names match
		customer.setName(rs.getString("name"));
		customer.setEmail(rs.getString("email"));

		return customer;
	}
}
