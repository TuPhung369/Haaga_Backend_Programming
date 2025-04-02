package com.database.study.configuration;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import javax.sql.DataSource;

@Configuration
public class AppConfig {

  @Value("${datasource.url}")
  private String datasourceUrl;

  @Value("${datasource.username}")
  private String datasourceUsername;

  @Value("${datasource.password}")
  private String datasourcePassword;

  @Value("${datasource.driver-class-name}")
  private String datasourceDriverClassName;

  @Bean
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }

  @Bean
  public DataSource dataSource() {
    HikariDataSource dataSource = new HikariDataSource();
    dataSource.setJdbcUrl(datasourceUrl);
    dataSource.setUsername(datasourceUsername);
    dataSource.setPassword(datasourcePassword);
    dataSource.setDriverClassName(datasourceDriverClassName);
    dataSource.setMaximumPoolSize(10);
    dataSource.setMinimumIdle(5);
    dataSource.setConnectionTimeout(30000);
    dataSource.setPoolName("AppHikariPool");

    return dataSource;
  }
}