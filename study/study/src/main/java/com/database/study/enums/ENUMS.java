package com.database.study.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class ENUMS {

  @Getter
  @AllArgsConstructor
  public enum Role {
    ADMIN("Administrator - Full access to the system"),
    USER("Regular User - Limited access"),
    MANAGER("Manager - Can oversee and manage user activities");

    private final String description;
  }

  @Getter
  @AllArgsConstructor
  public enum Permission {
    CREATE("Permission to create data"),
    READ("Permission to read data"),
    UPDATE("Permission to update existing data"),
    DELETE("Permission to delete data");

    private final String description;
  }
}
