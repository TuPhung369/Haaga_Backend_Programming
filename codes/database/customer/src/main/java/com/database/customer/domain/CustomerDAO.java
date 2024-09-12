package com.database.customer.domain;

import java.util.List;

public interface CustomerDAO {
	public void save(Customer customer);

	public Customer findOne(int id);

	public List<Customer> findAll();

	boolean existsById(Long id);

	void deleteById(Long id);
}
