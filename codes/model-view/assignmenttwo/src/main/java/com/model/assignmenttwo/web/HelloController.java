package com.model.assignmenttwo.web;

import com.model.assignmenttwo.domain.Student;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;
import java.util.List;

@Controller
public class HelloController {

	@GetMapping("/hello")
	public String sayHello(Model model) {
		// Create student objects
		List<Student> students = Arrays.asList(
				new Student("Kate", "Cole"),
				new Student("Dan", "Brown"),
				new Student("Mike", "Mars"));

		// Add students to the model
		model.addAttribute("students", students);

		return "hello";
	}
}
