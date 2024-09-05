package com.model.bookstore.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BookController {

  @GetMapping("/index")
  public String index(Model model) {
    model.addAttribute("message", "Welcome to the Bookstore!");
    return "index";
  }
}
