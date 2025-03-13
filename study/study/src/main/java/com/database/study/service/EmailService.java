package com.database.study.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender emailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${application.name:TOM}")
    private String applicationName;

    @Value("${application.url:http://localhost:9095/identify_service}")
    private String applicationUrl;

    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true); // Set to true to enable HTML content

            emailSender.send(message);
            // log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendEmailChangeVerification(String newEmail, String userName, String verificationCode) {
        String subject = "Verify Your New Email Address";

        String emailContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                "<div style='background-color: #f8f9fa; padding: 20px; text-align: center;'>" +
                "<h2 style='color: #0066cc;'>Email Address Verification</h2>" +
                "</div>" +
                "<div style='padding: 20px; border: 1px solid #e9ecef; background-color: white;'>" +
                "<p>Hello " + userName + ",</p>" +
                "<p>You've requested to change your email address. Please use the verification code below to complete the process:</p>"
                +
                "<div style='background-color: #f8f9fa; padding: 12px; margin: 20px 0; text-align: center;'>" +
                "<h1 style='font-family: monospace; letter-spacing: 10px; margin: 0; color: #0066cc;'>"
                + verificationCode + "</h1>" +
                "</div>" +
                "<p>This code will expire in 15 minutes.</p>" +
                "<p>If you didn't request this change, please ignore this email or contact support.</p>" +
                "<p>Thanks,<br>Your Application Team</p>" +
                "</div>" +
                "<div style='background-color: #f8f9fa; color: #6c757d; padding: 15px; text-align: center; font-size: 12px;'>"
                +
                "<p>This is an automated message, please do not reply directly to this email.</p>" +
                "</div>" +
                "</div>";

        sendSimpleMessage(newEmail, subject, emailContent);
    }

    public void sendPasswordResetEmail(String to, String username, String resetCode) {
        String subject = "Password Reset Verification Code";

        // Create HTML template with styled verification code
        String emailContent = createPasswordResetEmailTemplate(username, resetCode);

        sendSimpleMessage(to, subject, emailContent);
    }

    public void sendEmailVerificationCode(String to, String username, String verificationCode) {
        String subject = "Email Verification Code";

        // Create HTML template with styled verification code
        String emailContent = createEmailVerificationTemplate(username, verificationCode);

        sendSimpleMessage(to, subject, emailContent);
    }

private String createEmailVerificationTemplate(String username, String verificationCode) {
    // Format the 6-digit code to add visual separation
    char[] codeChars = verificationCode.toCharArray();

    return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #eeeeee;
                    }
                    .content {
                        padding: 20px 0;
                    }
                    .verification-code {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .code-container {
                        display: inline-block;
                        margin: 0 auto;
                        background-color: #f5f5f5;
                        border-radius: 10px;
                        padding: 15px 20px;
                    }
                    .code-digit {
                        display: inline-block;
                        width: 40px;
                        height: 50px;
                        margin: 0 5px;
                        background-color: #ffffff;
                        border: 1px solid #dddddd;
                        border-radius: 5px;
                        font-size: 24px;
                        font-weight: bold;
                        line-height: 50px;
                        text-align: center;
                        color: #333333;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eeeeee;
                        font-size: 12px;
                        color: #777777;
                        text-align: center;
                    }
                    .expiration-note {
                        font-style: italic;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Email Verification</h2>
                </div>
                <div class="content">
                    <p>Hello %s,</p>
                    <p>Thank you for registering. Please use the verification code below to verify your email address:</p>

                    <div class="verification-code">
                        <div class="code-container">
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                        </div>
                    </div>

                    <p class="expiration-note">This code will expire in 15 minutes.</p>

                    <p>If you did not create an account, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; %d Tu Phung. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            .formatted(
                    escapeHtml(username),
                    codeChars[0], codeChars[1], codeChars[2],
                    codeChars[3], codeChars[4], codeChars[5],
                    java.time.Year.now().getValue());
}

private String createPasswordResetEmailTemplate(String username, String resetCode) {
    // Format the 6-digit code to add visual separation
    char[] codeChars = resetCode.toCharArray();

    return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #eeeeee;
                    }
                    .content {
                        padding: 20px 0;
                    }
                    .verification-code {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .code-container {
                        display: inline-block;
                        margin: 0 auto;
                        background-color: #f5f5f5;
                        border-radius: 10px;
                        padding: 15px 20px;
                    }
                    .code-digit {
                        display: inline-block;
                        width: 40px;
                        height: 50px;
                        margin: 0 5px;
                        background-color: #ffffff;
                        border: 1px solid #dddddd;
                        border-radius: 5px;
                        font-size: 24px;
                        font-weight: bold;
                        line-height: 50px;
                        text-align: center;
                        color: #333333;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eeeeee;
                        font-size: 12px;
                        color: #777777;
                        text-align: center;
                    }
                    .expiration-note {
                        font-style: italic;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Password Reset Verification</h2>
                </div>
                <div class="content">
                    <p>Hello %s,</p>
                    <p>We received a request to reset your password. Please use the verification code below to complete the process:</p>

                    <div class="verification-code">
                        <div class="code-container">
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                            <div class="code-digit">%c</div>
                        </div>
                    </div>

                    <p class="expiration-note">This code will expire in 15 minutes.</p>

                    <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; %d Tu Phung. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            .formatted(
                    escapeHtml(username),
                    codeChars[0], codeChars[1], codeChars[2],
                    codeChars[3], codeChars[4], codeChars[5],
                    java.time.Year.now().getValue());
}

public String getTotpResetApprovedTemplate(String firstName) {
    return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TOTP Reset Approved</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                    .content { padding: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }
                    .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>TOTP Reset Request Approved</h2>
                </div>
                <div class="content">
                    <p>Dear %s,</p>
                    <p>Your request to reset your two-factor authentication (TOTP) has been <strong>approved</strong>.</p>
                    <p>Your TOTP has been reset, and you can now set up a new device by visiting your account security settings.</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="%s/settings/security" class="button">Security Settings</a>
                    </p>
                    <p><strong>Important:</strong> If you did not request this reset, please contact support immediately.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; %d %s. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            .formatted(
                    escapeHtml(firstName),
                    applicationUrl,
                    java.time.Year.now().getValue(),
                    escapeHtml(applicationName));
}

public String getTotpResetRejectedTemplate(String firstName) {
    return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TOTP Reset Rejected</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                    .content { padding: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }
                    .support-button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>TOTP Reset Request Rejected</h2>
                </div>
                <div class="content">
                    <p>Dear %s,</p>
                    <p>Your request to reset your two-factor authentication (TOTP) has been <strong>rejected</strong>.</p>
                    <p>If you believe this is a mistake or if you still need assistance, please contact our support team.</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="%s/support" class="support-button">Contact Support</a>
                    </p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; %d %s. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            .formatted(
                    escapeHtml(firstName),
                    applicationUrl,
                    java.time.Year.now().getValue(),
                    escapeHtml(applicationName));
}

    public String getAdminNotificationTemplate(String username, String userId, String email, String requestId) {
        // Format the current date in a controlled way
    String formattedDate = java.time.LocalDateTime.now()
        .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    
    // Build HTML content safely
    StringBuilder htmlBuilder = new StringBuilder();
    htmlBuilder.append("<!DOCTYPE html>\n<html>\n<head>\n");
    htmlBuilder.append("<meta charset=\"UTF-8\">\n");
    htmlBuilder.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
    htmlBuilder.append("<title>TOTP Reset Request Notification</title>\n");
    htmlBuilder.append("<style>\n");
    htmlBuilder.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }\n");
    htmlBuilder.append(".header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }\n");
    htmlBuilder.append(".content { padding: 20px 0; }\n");
    htmlBuilder.append(".footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }\n");
    htmlBuilder.append(".info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n");
    htmlBuilder.append(".info-table td { padding: 8px; border-bottom: 1px solid #eee; }\n");
    htmlBuilder.append(".info-table td:first-child { font-weight: bold; width: 30%; }\n");
    htmlBuilder.append(".action-button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }\n");
    htmlBuilder.append("</style>\n</head>\n<body>\n");
    
    // Header
    htmlBuilder.append("<div class=\"header\">\n");
    htmlBuilder.append("<h2>New TOTP Reset Request</h2>\n");
    htmlBuilder.append("</div>\n");
    
    // Content
    htmlBuilder.append("<div class=\"content\">\n");
    htmlBuilder.append("<p>A new request to reset TOTP has been submitted and requires administrator review.</p>\n");
    htmlBuilder.append("<table class=\"info-table\">\n");
    
    // User information - safely added
    htmlBuilder.append("<tr><td>Username:</td><td>").append(escapeHtml(username)).append("</td></tr>\n");
    htmlBuilder.append("<tr><td>User ID:</td><td>").append(escapeHtml(userId)).append("</td></tr>\n");
    htmlBuilder.append("<tr><td>Email:</td><td>").append(escapeHtml(email)).append("</td></tr>\n");
    htmlBuilder.append("<tr><td>Request ID:</td><td>").append(escapeHtml(requestId)).append("</td></tr>\n");
    htmlBuilder.append("<tr><td>Request Time:</td><td>").append(escapeHtml(formattedDate)).append("</td></tr>\n");
    
    htmlBuilder.append("</table>\n");
    htmlBuilder.append("<p style=\"text-align: center; margin: 30px 0;\">\n");
    htmlBuilder.append("<a href=\"").append(applicationUrl).append("/admin/totp-reset\" class=\"action-button\">Review Request</a>\n");
    htmlBuilder.append("</p>\n</div>\n");
    
    // Footer
    htmlBuilder.append("<div class=\"footer\">\n");
    htmlBuilder.append("<p>This is an automated message, please do not reply to this email.</p>\n");
    htmlBuilder.append("<p>&copy; ").append(java.time.Year.now().getValue()).append(" ").append(applicationName).append(". All rights reserved.</p>\n");
    htmlBuilder.append("</div>\n</body>\n</html>");
    
    String result = htmlBuilder.toString();
        log.info("Template generated successfully with length: {} characters", result.length());
    return result;

}

// Helper method to escape HTML special characters
private String escapeHtml(String input) {
    if (input == null) {
        return "";
    }
    return input.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;")
            .replace(";", "&#59;"); // Specifically escape semicolons
}

}