package fi.haagahelia.course.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import fi.haagahelia.course.domain.Message;
import jakarta.validation.Valid;

@Controller
public class MessageController {

    @RequestMapping(value="/hello", method=RequestMethod.GET)
    public String greetingForm(Model model) {
    	System.out.println("hello hello");
    	model.addAttribute("message", new Message());
        return "hello";
    }

    @RequestMapping(value="/hello", method=RequestMethod.POST)
    public String greetingSubmit(@Valid Message msg, BindingResult bindingResult, Model model) {
        if (bindingResult.hasErrors()) {
        	return "hello";
        }
        
    	model.addAttribute("message", msg);
        return "result";
    }

}