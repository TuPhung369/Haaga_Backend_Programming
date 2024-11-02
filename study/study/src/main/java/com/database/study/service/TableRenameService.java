package com.database.study.service;

import java.sql.ResultSet;
import javax.sql.DataSource;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.database.study.configuration.DatabaseContext;

@Service
public class TableRenameService {

  private final JdbcTemplate jdbcTemplate;
  private final DataSource primaryDataSource;
  private final DataSource secondaryDataSource;

  public TableRenameService(JdbcTemplate jdbcTemplate, DataSource primaryDataSource, DataSource secondaryDataSource) {
    this.jdbcTemplate = jdbcTemplate;
    this.primaryDataSource = primaryDataSource;
    this.secondaryDataSource = secondaryDataSource;
  }

  public void renameDatabase(String oldDatabaseName, String newDatabaseName) {
    try {
      // Step 1: Check existing databases
      System.out.println("Checking existing databases...");
      jdbcTemplate.query("SHOW DATABASES", (ResultSet rs) -> {
        while (rs.next()) {
          System.out.println("Found database: " + rs.getString(1));
        }
      });

      // Step 2: Check if the old database exists
      System.out.println("Checking if the old database " + oldDatabaseName + " exists...");
      boolean dbExists = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?",
          Integer.class,
          oldDatabaseName) > 0;

      if (!dbExists) {
        System.out.println("Database " + oldDatabaseName + " does not exist. Exiting rename operation.");
        return; // Exit if the database doesn't exist
      }

      // Step 3: Create the new database
      System.out.println("Creating new database: " + newDatabaseName);
      String createNewDbSql = String.format("CREATE DATABASE %s", newDatabaseName);
      jdbcTemplate.execute(createNewDbSql);
      System.out.println("New database created successfully: " + newDatabaseName);

      // Step 4: Copy data from old database to new database
      System.out.println("Copying data from " + oldDatabaseName + " to " + newDatabaseName);
      jdbcTemplate.query("SHOW TABLES IN " + oldDatabaseName, (ResultSet rs) -> {
        while (rs.next()) {
          String tableName = rs.getString(1);
          String createTableSql = String.format("CREATE TABLE %s.%s LIKE %s.%s", newDatabaseName, tableName,
              oldDatabaseName, tableName);
          jdbcTemplate.execute(createTableSql);

          String copyDataSql = String.format("INSERT INTO %s.%s SELECT * FROM %s.%s", newDatabaseName, tableName,
              oldDatabaseName, tableName);
          jdbcTemplate.execute(copyDataSql);
          System.out.println("Copied data for table: " + tableName);
        }
      });

      // Step 5: Drop the old database (optional)
      System.out.println("Dropping old database: " + oldDatabaseName);
      String dropOldDbSql = String.format("DROP DATABASE %s", oldDatabaseName);
      jdbcTemplate.execute(dropOldDbSql);
      System.out.println("Old database dropped successfully: " + oldDatabaseName);

      // Step 6: Check databases after renaming
      System.out.println("Checking existing databases after renaming...");
      jdbcTemplate.query("SHOW DATABASES", (ResultSet rs) -> {
        while (rs.next()) {
          System.out.println("Remaining database: " + rs.getString(1));
        }
      });

      System.out.println("Database renamed successfully from " + oldDatabaseName + " to " + newDatabaseName);
    } catch (Exception e) {
      System.err.println("Failed to rename database: " + e.getMessage());
    }
  }

  public void checkAndSetDatabase() {
    try {
      // Try connecting to the primary database
      jdbcTemplate.setDataSource(primaryDataSource);
      // Perform a simple query to check if the primary database is accessible
      jdbcTemplate.queryForObject("SELECT 1", Integer.class);
      DatabaseContext.setCurrentDatabase("PRIMARY");
    } catch (Exception e) {
      System.out.println("Primary database not available, switching to secondary...");
      try {
        // If primary is not available, try the secondary database
        jdbcTemplate.setDataSource(secondaryDataSource);
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        DatabaseContext.setCurrentDatabase("SECONDARY");
      } catch (Exception ex) {
        System.err.println("Both databases are unavailable: " + ex.getMessage());
      }
    }
  }
}
