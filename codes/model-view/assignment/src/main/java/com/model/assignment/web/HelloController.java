package com.model.assignment.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HelloController {

	@GetMapping("/hello")
	public String sayHello(
			@RequestParam(name = "name", required = false, defaultValue = "Guest") String name,
			@RequestParam(name = "age", required = false, defaultValue = "0") int age,
			Model model) {

		model.addAttribute("name", name);
		model.addAttribute("age", age);

		return "hello";
	}
}
