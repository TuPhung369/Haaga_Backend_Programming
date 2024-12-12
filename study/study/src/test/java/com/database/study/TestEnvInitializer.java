package com.database.study;

import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;

public class TestEnvInitializer {
  @BeforeAll
  static void loadEnv() {
    Dotenv dotenv = Dotenv.configure()
        .directory("./") // Location of your .env file
        .ignoreIfMalformed()
        .ignoreIfMissing()
        .load();

    dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
  }
}
