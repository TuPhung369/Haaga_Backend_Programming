package fi.haagahelia.course.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import fi.haagahelia.course.domain.Student;
import fi.haagahelia.course.domain.StudentRepository;

@Controller
public class StudentController {
    @Autowired
    private StudentRepository repository;

    @RequestMapping(value = { "/", "/studentlist" })
    public String studentList(Model model) {
        // Remove the line since the student object is not used
        repository.save(new Student("John", "Max", "TOM@hehe.com"));
        model.addAttribute("students", repository.findAll());
        return "studentlist";
    }

}
