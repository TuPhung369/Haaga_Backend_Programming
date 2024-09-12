package com.database.customer.web;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.database.customer.domain.Customer;
import com.database.customer.domain.CustomerDAO;

@Controller
public class CustomerController {

  @Autowired
  private CustomerDAO customerDAO;

  @GetMapping("/customer")
  public String customerList(Model model) {
    List<Customer> customers = customerDAO.findAll();

    // Debugging: Print the number of customers found
    System.out.println("Number of customers found: " + customers.size());

    model.addAttribute("customers", customers); // Add customers to the model for the view
    return "customer"; // Return the view name
  }

  @GetMapping("/customer/add")
  public String addCustomerForm(Model model) {
    model.addAttribute("customer", new Customer());
    return "add-customer";
  }

  @PostMapping("/customer/add")
  public String addCustomer(@ModelAttribute Customer customer) {
    // Debugging: Print customer data
    // System.out.println("Adding customer: " + customer.getName() + ", " +
    // customer.getEmail());

    customerDAO.save(customer); // Call to DAO to save the customer
    // System.out.println("After saving customer: " + customer.getId());
    // After saving, redirect to the customer list
    return "redirect:/customer";
  }

  @PostMapping("/customer/save")
  public String saveCustomer(@ModelAttribute Customer customer) {
    customerDAO.save(customer);
    return "redirect:/customer";
  }

  @PostMapping("/customer/edit")
  public String updateCustomer(@ModelAttribute Customer customer) {
    customerDAO.save(customer); // Save the updated customer data
    return "redirect:/customer"; // Redirect to the customer list
  }

  @GetMapping("/customer/edit/{id}")
  public String editCustomerForm(@PathVariable("id") Long id, Model model) {
    Customer customer = customerDAO.findOne(id.intValue()); // Convert Long to int
    if (customer != null) {
      model.addAttribute("customer", customer);
      return "edit-customer";
    } else {
      return "redirect:/customer";
    }
  }

  @PostMapping("/customer/delete/{id}")
  public String deleteCustomer(@PathVariable("id") Long id) {
    if (customerDAO.existsById(id)) {
      customerDAO.deleteById(id);
    }
    return "redirect:/customer";
  }
}
