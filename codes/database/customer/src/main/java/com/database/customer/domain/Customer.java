package com.database.customer.domain;

public class Customer {
  private Long id;
  private String name;
  private String email;

  // Default constructor
  public Customer() {
    this.id = 0L;
    this.name = null;
    this.email = null;
  }

  // Parameterized constructor
  public Customer(Long id, String name, String email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  public Customer(String name, String email) {
    this.id = 0L;
    this.name = name;
    this.email = email;
  }

  // Getters and setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  @Override
  public String toString() {
    return String.format("Customer[id=%d, name='%s', email='%s']", id, name, email);
  }
}
