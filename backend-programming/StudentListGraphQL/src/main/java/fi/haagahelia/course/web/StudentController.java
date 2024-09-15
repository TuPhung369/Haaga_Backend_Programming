package fi.haagahelia.course.web;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import fi.haagahelia.course.domain.DepartmentRepository;
import fi.haagahelia.course.domain.Student;
import fi.haagahelia.course.domain.StudentRepository;

@Controller
public class StudentController {
	@Autowired
	private StudentRepository repository; 

	@Autowired
	private DepartmentRepository drepository; 
	
	// Show all students
    @RequestMapping(value="/studentlist")
    public String studentList(Model model) {	
        model.addAttribute("students", repository.findAll());
        return "studentlist";
    }
  
	// RESTful service to get all students
    @GetMapping("/students")
    public @ResponseBody List<Student> studentListRest() {	
        return (List<Student>) repository.findAll();
    }    

	// RESTful service to get student by id
    @GetMapping("/student/{id}")
    public @ResponseBody Optional<Student> findStudentRest(@PathVariable("id") Long studentId) {	
    	return repository.findById(studentId);
    }       
    
    // Add new student
    @RequestMapping(value = "/add")
    public String addStudent(Model model){
    	model.addAttribute("student", new Student());
    	model.addAttribute("departments", drepository.findAll());
        return "addstudent";
    }     
    
    // Save new student
    @PostMapping("/save")
    public String save(Student student){
        repository.save(student);
        return "redirect:studentlist";
    }    

    // Delete student
    @GetMapping("/delete/{id}")
    public String deleteStudent(@PathVariable("id") Long studentId, Model model) {
    	repository.deleteById(studentId);
        return "redirect:../studentlist";
    }     
}
