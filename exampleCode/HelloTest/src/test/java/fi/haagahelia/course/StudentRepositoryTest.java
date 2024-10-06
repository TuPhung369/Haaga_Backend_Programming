package fi.haagahelia.course;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import fi.haagahelia.course.domain.Student;
import fi.haagahelia.course.domain.StudentRepository;

@SpringBootTest
public class StudentRepositoryTest {

  @Autowired
  private StudentRepository studentRepository;

  @Test
  public void contexLoads() throws Exception {
    assertThat(studentRepository).isNotNull();
  }

  @Test
  public void findByLastName() {
    List<Student> students = studentRepository.findByLastName("Bauer");

    assertThat(students).hasSize(1);
    assertThat(studentRepository.findByLastName("Bauer")).isNotNull();
  }

  @Test
  public void createNewStudent() {
    Student student = new Student("John", "Doe", "john.doe@gmail.com");
    studentRepository.save(student);
    assertThat(student.getStudentId()).isNotNull();
  }
}