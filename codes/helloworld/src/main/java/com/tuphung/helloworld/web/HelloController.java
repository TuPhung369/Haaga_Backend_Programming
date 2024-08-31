package com.tuphung.helloworld.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@ResponseBody
public class HelloController {

  @RequestMapping("/bitcoin")
  public String bitcoin(@RequestParam(value = "price", defaultValue = "10,000") String price,
      @RequestParam(value = "currency", defaultValue = "USD") String currency) {
    return "The Price of Bitcoin is " + price + " " + currency;
  }

  @RequestMapping("/tom")
  public String tom(@RequestParam(value = "name", defaultValue = "ABC") String name,
      @RequestParam(value = "location", defaultValue = "sun") String location) {
    return "Welcome to the " + location + " " + name;
  }

  @RequestMapping("/chatgpt")
  public String chatgpt() {
    return "ChatGPT is a chatbot that can chat with you";
  }

  // New method to handle /hello request
  @RequestMapping("/hello")
  public String hello(@RequestParam(value = "location", defaultValue = "moon") String location,
      @RequestParam(value = "name", defaultValue = "John") String name) {
    return "Welcome to the " + location + " " + name + "!";
  }
}
