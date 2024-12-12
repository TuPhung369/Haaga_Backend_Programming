package com.database.study;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class StudyApplicationTests {

	@BeforeAll
	static void setup() {
		TestEnvInitializer.loadEnv();
	}

	@Test
	void contextLoads() {
	}
}
