package com.database.study.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.slf4j.Slf4j;

/**
 * Controller to handle the root path and redirect to the appropriate page
 */
@Controller
@Slf4j
public class WelcomeController {

    /**
     * Handle the root path and redirect to the index.html page
     * @return The view name
     */
    @GetMapping("/")
    public String welcome() {
        log.info("Welcome endpoint called");
        return "forward:/index.html";
    }
}