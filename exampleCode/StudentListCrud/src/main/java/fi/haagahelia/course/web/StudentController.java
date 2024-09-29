package fi.haagahelia.course.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import fi.haagahelia.course.domain.Student;
import fi.haagahelia.course.domain.StudentRepository;

@Controller
public class StudentController {
	@Autowired
	private StudentRepository repository; 
	
    @RequestMapping(value= {"/", "/studentlist"})
    public String studentList(Model model) {	
        model.addAttribute("students", repository.findAll());
        return "studentlist";
    }
  
    @RequestMapping(value = "/add")
    public String addStudent(Model model){
    	model.addAttribute("student", new Student());
        return "addstudent";
    }     
    
    @PostMapping("/save")
    public String save(Student student){
        repository.save(student);
        return "redirect:studentlist";
    }    

    @GetMapping("/delete/{id}")
    public String deleteStudent(@PathVariable("id") Long studentId, Model model) {
    	repository.deleteById(studentId);
        return "redirect:../studentlist";
    }     
}