---
timestamp: 2025-08-25T18:42:50.395887
initial_query: Continue. You were in the middle of request - Spring Boot circular dependency with UserMapper bean
task_state: resolved
total_messages: 154
solution_evolution: field_lazy_annotation -> constructor_lazy_injection
---

# Complete Solution: Spring Boot Circular Dependency with UserMapper

## Problem Overview

**Error**: `BeanCurrentlyInCreationException: Error creating bean with name 'userMapper': Requested bean is currently in creation: Is there an unresolvable circular reference or an asynchronous initialization dependency?`

**Trigger**: Running `mvn clean compile spring-boot:run` caused application crash during startup

**Root Cause**: Circular dependency between MapStruct-generated `UserMapper` implementations and Spring service classes (`AuthenticationService` and `UserService`)

## Solution Evolution

### Initial Approach (Partial Success)

**Timestamp**: 2025-08-25T18:33:56 | **Messages**: 53

Applied `@Lazy` annotation directly to field declarations while keeping `@RequiredArgsConstructor`:

```java
// AuthenticationService.java
@Lazy final UserMapper userMapper;

// UserService.java
@Lazy UserMapper userMapper;
```

**Result**: Compilation successful, but circular dependency persisted during runtime startup.

### Final Solution (Complete Success)

**Timestamp**: 2025-08-25T18:42:50 | **Messages**: 101

Replaced Lombok's `@RequiredArgsConstructor` with manual constructor injection and applied `@Lazy` to constructor parameters:

#### AuthenticationService.java

```java
import org.springframework.context.annotation.Lazy;

@Service
public class AuthenticationService {
    private final UserMapper userMapper;
    // other dependencies...

    // Manual constructor replacing @RequiredArgsConstructor
    public AuthenticationService(@Lazy UserMapper userMapper, /* other params */) {
        this.userMapper = userMapper;
        // initialize other fields...
    }
}
```

#### UserService.java

```java
import org.springframework.context.annotation.Lazy;

@Service
public class UserService {
    private final UserMapper userMapper;
    // other dependencies...

    // Manual constructor replacing @RequiredArgsConstructor
    public UserService(@Lazy UserMapper userMapper, /* other params */) {
        this.userMapper = userMapper;
        // initialize other fields...
    }
}
```

## Technical Analysis

### Why the First Approach Failed

- `@Lazy` on field declarations with `@RequiredArgsConstructor` doesn't affect constructor parameter injection
- Lombok generates constructor parameters without the `@Lazy` annotation
- Spring still attempts eager initialization during bean creation

### Why the Final Approach Succeeded

- `@Lazy` on constructor parameters creates a proxy for the `UserMapper` bean
- Breaks the circular dependency chain during Spring's bean initialization phase
- Allows Spring to defer the actual bean creation until first method call
- Maintains proper dependency injection patterns

### Circular Dependency Chain

```
AuthenticationService → UserMapper → (MapStruct generated impl) → UserService → UserMapper
```

The `@Lazy` annotation on constructor parameters breaks this chain by creating a proxy.

## Verification Results

### Compilation

```powershell
mvn clean compile
```

✅ **SUCCESS**: All classes compiled without errors, MapStruct processors generated implementations

### Application Startup

```powershell
mvn spring-boot:run
```

✅ **SUCCESS**: Application reached `ACCEPTING_TRAFFIC` state, database connections established

### Key Success Indicators

- Spring Boot initialization completed
- All beans created successfully
- Database connectivity established
- Application ready to serve requests

## Best Practices Learned

1. **Constructor Parameter `@Lazy`**: More effective than field-level `@Lazy` for circular dependencies
2. **Manual Constructor Injection**: Sometimes necessary when Lombok annotations conflict with Spring annotations
3. **MapStruct Circular Dependencies**: Common in complex applications with interdependent services
4. **Spring Bean Lifecycle**: Understanding proxy creation is crucial for resolving circular dependencies

## Files Modified

### Primary Changes

- **e:\IT\Haaga_Backend_Programming\study\study\src\main\java\com\database\study\service\AuthenticationService.java** (lines 99-153)
- **e:\IT\Haaga_Backend_Programming\study\study\src\main\java\com\database\study\service\UserService.java** (lines 44-90)

### Related Files

- **e:\IT\Haaga_Backend_Programming\study\study\src\main\java\com\database\study\mapper\UserMapper.java** (lines 22-89)

## Environment Details

- **Spring Boot**: 3.4.4
- **Java**: 21
- **MapStruct**: 1.6.3
- **Lombok**: 1.18.38
- **Build Tool**: Maven
- **OS**: Windows 11 Pro for Workstations
- **Shell**: PowerShell

## Resolution Timeline

| Stage | Timestamp | Approach                      | Result           |
| ----- | --------- | ----------------------------- | ---------------- |
| 1     | 18:33:56  | Field `@Lazy` annotation      | Partial success  |
| 2     | 18:42:50  | Constructor `@Lazy` injection | Complete success |

## Status: ✅ RESOLVED

The Spring Boot circular dependency issue with UserMapper has been completely resolved. The application now starts successfully and is ready for development and deployment.
