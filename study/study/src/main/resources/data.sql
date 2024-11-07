-- Insert or update ADMIN role
IF EXISTS (SELECT 1 FROM role WHERE name = 'ADMIN')
BEGIN
    PRINT 'Updating ADMIN role';
    UPDATE role SET description = 'Admin role' WHERE name = 'ADMIN';
END
ELSE
BEGIN
    PRINT 'Inserting ADMIN role';
    INSERT INTO role (name, description) VALUES ('ADMIN', 'Admin role');
END;

-- Insert or update USER role
IF EXISTS (SELECT 1 FROM role WHERE name = 'USER')
BEGIN
    PRINT 'Updating USER role';
    UPDATE role SET description = 'User role' WHERE name = 'USER';
END
ELSE
BEGIN
    PRINT 'Inserting USER role';
    INSERT INTO role (name, description) VALUES ('USER', 'User role');
END;

-- Insert or update UPDATE_POST permission
IF EXISTS (SELECT 1 FROM permission WHERE name = 'UPDATE_POST')
BEGIN
    PRINT 'Updating UPDATE_POST permission';
    UPDATE permission SET description = 'Update Post permission' WHERE name = 'UPDATE_POST';
END
ELSE
BEGIN
    PRINT 'Inserting UPDATE_POST permission';
    INSERT INTO permission (name, description) VALUES ('UPDATE_POST', 'Update Post permission');
END;

-- Insert or update APPROVE_POST permission
IF EXISTS (SELECT 1 FROM permission WHERE name = 'APPROVE_POST')
BEGIN
    PRINT 'Updating APPROVE_POST permission';
    UPDATE permission SET description = 'Approve Post permission' WHERE name = 'APPROVE_POST';
END
ELSE
BEGIN
    PRINT 'Inserting APPROVE_POST permission';
    INSERT INTO permission (name, description) VALUES ('APPROVE_POST', 'Approve Post permission');
END;

-- Insert or update REJECT_POST permission
IF EXISTS (SELECT 1 FROM permission WHERE name = 'REJECT_POST')
BEGIN
    PRINT 'Updating REJECT_POST permission';
    UPDATE permission SET description = 'Reject Post permission' WHERE name = 'REJECT_POST';
END
ELSE
BEGIN
    PRINT 'Inserting REJECT_POST permission';
    INSERT INTO permission (name, description) VALUES ('REJECT_POST', 'Reject Post permission');
END;

-- Insert or update READ_POST permission
IF EXISTS (SELECT 1 FROM permission WHERE name = 'READ_POST')
BEGIN
    PRINT 'Updating READ_POST permission';
    UPDATE permission SET description = 'Read Post permission' WHERE name = 'READ_POST';
END
ELSE
BEGIN
    PRINT 'Inserting READ_POST permission';
    INSERT INTO permission (name, description) VALUES ('READ_POST', 'Read Post permission');
END;

-- Associate permissions with the ADMIN role
PRINT 'Associating permissions with ADMIN role';
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'ADMIN' AND p.name IN ('UPDATE_POST', 'REJECT_POST', 'READ_POST')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Associate permissions with the USER role
PRINT 'Associating permissions with USER role';
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'USER' AND p.name IN ('UPDATE_POST', 'REJECT_POST', 'READ_POST')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
