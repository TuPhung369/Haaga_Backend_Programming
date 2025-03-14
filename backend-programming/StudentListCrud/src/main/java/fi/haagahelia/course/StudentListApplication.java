package fi.haagahelia.course;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import fi.haagahelia.course.domain.Student;
import fi.haagahelia.course.domain.StudentRepository;

@SpringBootApplication
public class StudentListApplication {

	private static final Logger log = LoggerFactory.getLogger(StudentListApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(StudentListApplication.class, args);
	}

	@Bean
	public CommandLineRunner studentDemo(StudentRepository repository) {
		return (_) -> {
			log.info("save a couple of students");
			repository.save(new Student("Aku", "Johnson", "john@john.com"));
			repository.save(new Student("Ankka", "Kateson", "kate@kate.com"));

			repository.save(new Student("Musta", "Naamio", "mm@bengali.org"));

			log.info("fetch all students");
			for (Student student : repository.findAll()) {
				log.info(student.toString());
			}
			log.info("haetaan kaikki Naamiot");
			for (Student student : repository.findByLastName("Naamio")) {
				log.info(student.toString());
			}

		};
	}

}
