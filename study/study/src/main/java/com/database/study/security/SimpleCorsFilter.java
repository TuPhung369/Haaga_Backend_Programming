package com.database.study.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import org.springframework.stereotype.Component;

@Component
public class SimpleCorsFilter implements Filter {

  @Override
  public void init(FilterConfig filterConfig) throws ServletException {
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletResponse httpServletResponse = (HttpServletResponse) response;
    httpServletResponse.setHeader("Access-Control-Allow-Origin", "*"); // Allows any domain to make requests
    httpServletResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    httpServletResponse.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
    httpServletResponse.setHeader("Access-Control-Allow-Credentials", "true");
    chain.doFilter(request, response);
  }

  @Override
  public void destroy() {
    // No resource cleanup needed
  }
}
