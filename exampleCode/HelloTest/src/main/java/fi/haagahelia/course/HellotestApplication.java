package fi.haagahelia.course;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import fi.haagahelia.course.domain.Student;
import fi.haagahelia.course.domain.StudentRepository;

@SpringBootApplication
public class HellotestApplication {

	public static void main(String[] args) {
		SpringApplication.run(HellotestApplication.class, args);
	}

	@Bean
	public CommandLineRunner demo(StudentRepository studentRepository) {
		return (args) -> {
			// save a couple of students
			studentRepository.save(new Student("Jack", "Bauer", "jack.bauer@gmail.com"));
			studentRepository.save(new Student("Chloe", "O'Brian", "chloe.obrain@gmail.com"));
		};
	}
}
