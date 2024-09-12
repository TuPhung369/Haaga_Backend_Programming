package com.database.customer.domain;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class CustomerRepository {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Transactional(readOnly = true)
  public List<Customer> findAll() {
    return jdbcTemplate.query("SELECT id, name, email FROM customer", new CustomerRowMapper());
  }

  public void save(Customer customer) {
    String sql = "INSERT INTO customer(name, email) VALUES(?,?)";
    Object[] parameters = new Object[] { customer.getName(), customer.getEmail() };
    jdbcTemplate.update(sql, parameters);
  }
}
