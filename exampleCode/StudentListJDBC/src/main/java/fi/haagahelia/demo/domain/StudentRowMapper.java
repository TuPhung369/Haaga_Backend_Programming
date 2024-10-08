package fi.haagahelia.demo.domain;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.lang.NonNull;

public class StudentRowMapper implements RowMapper<Student> {

	public Student mapRow(@NonNull ResultSet rs, int rowNum) throws SQLException {
		Student student = new Student();
		student.setFirstName(rs.getString("first_name"));
		student.setLastName(rs.getString("last_name"));
		student.setId(rs.getLong("student_id"));

		return student;
	}
}