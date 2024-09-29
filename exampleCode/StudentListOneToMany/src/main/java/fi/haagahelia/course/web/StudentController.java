package fi.haagahelia.course.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

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
    @RequestMapping(value={"/", "/studentlist"})
    public String studentList(Model model) {	
        model.addAttribute("students", repository.findAll());
        return "studentlist";
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


    // Edit student
    @GetMapping("/edit/{id}")
    public String editStudent(@PathVariable("id") Long studentId, Model model) {
    	model.addAttribute("student", repository.findById(studentId));
    	model.addAttribute("departments", drepository.findAll());
    	return "editstudent";
    }   
 }
