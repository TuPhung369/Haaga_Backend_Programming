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
        
        String emailContent = 
            "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
            "<div style='background-color: #f8f9fa; padding: 20px; text-align: center;'>" +
            "<h2 style='color: #0066cc;'>Email Address Verification</h2>" +
            "</div>" +
            "<div style='padding: 20px; border: 1px solid #e9ecef; background-color: white;'>" +
            "<p>Hello " + userName + ",</p>" +
            "<p>You've requested to change your email address. Please use the verification code below to complete the process:</p>" +
            "<div style='background-color: #f8f9fa; padding: 12px; margin: 20px 0; text-align: center;'>" +
            "<h1 style='font-family: monospace; letter-spacing: 10px; margin: 0; color: #0066cc;'>" + verificationCode + "</h1>" +
            "</div>" +
            "<p>This code will expire in 15 minutes.</p>" +
            "<p>If you didn't request this change, please ignore this email or contact support.</p>" +
            "<p>Thanks,<br>Your Application Team</p>" +
            "</div>" +
            "<div style='background-color: #f8f9fa; color: #6c757d; padding: 15px; text-align: center; font-size: 12px;'>" +
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

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Email Verification</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: Arial, sans-serif;\n" +
                "            line-height: 1.6;\n" +
                "            color: #333333;\n" +
                "            max-width: 600px;\n" +
                "            margin: 0 auto;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .header {\n" +
                "            text-align: center;\n" +
                "            padding-bottom: 20px;\n" +
                "            border-bottom: 1px solid #eeeeee;\n" +
                "        }\n" +
                "        .content {\n" +
                "            padding: 20px 0;\n" +
                "        }\n" +
                "        .verification-code {\n" +
                "            text-align: center;\n" +
                "            margin: 30px 0;\n" +
                "        }\n" +
                "        .code-container {\n" +
                "            display: inline-block;\n" +
                "            margin: 0 auto;\n" +
                "            background-color: #f5f5f5;\n" +
                "            border-radius: 10px;\n" +
                "            padding: 15px 20px;\n" +
                "        }\n" +
                "        .code-digit {\n" +
                "            display: inline-block;\n" +
                "            width: 40px;\n" +
                "            height: 50px;\n" +
                "            margin: 0 5px;\n" +
                "            background-color: #ffffff;\n" +
                "            border: 1px solid #dddddd;\n" +
                "            border-radius: 5px;\n" +
                "            font-size: 24px;\n" +
                "            font-weight: bold;\n" +
                "            line-height: 50px;\n" +
                "            text-align: center;\n" +
                "            color: #333333;\n" +
                "            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n" +
                "        }\n" +
                "        .footer {\n" +
                "            margin-top: 30px;\n" +
                "            padding-top: 20px;\n" +
                "            border-top: 1px solid #eeeeee;\n" +
                "            font-size: 12px;\n" +
                "            color: #777777;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .expiration-note {\n" +
                "            font-style: italic;\n" +
                "            margin: 20px 0;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"header\">\n" +
                "        <h2>Email Verification</h2>\n" +
                "    </div>\n" +
                "    <div class=\"content\">\n" +
                "        <p>Hello " + username + ",</p>\n" +
                "        <p>Thank you for registering. Please use the verification code below to verify your email address:</p>\n"
                +
                "        \n" +
                "        <div class=\"verification-code\">\n" +
                "            <div class=\"code-container\">\n" +
                "                <div class=\"code-digit\">" + codeChars[0] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[1] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[2] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[3] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[4] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[5] + "</div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        \n" +
                "        <p class=\"expiration-note\">This code will expire in 15 minutes.</p>\n" +
                "        \n" +
                "        <p>If you did not create an account, please ignore this email.</p>\n" +
                "    </div>\n" +
                "    <div class=\"footer\">\n" +
                "        <p>This is an automated message, please do not reply to this email.</p>\n" +
                "        <p>&copy; " + java.time.Year.now().getValue() + " Tu Phung. All rights reserved.</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
    
    private String createPasswordResetEmailTemplate(String username, String resetCode) {
        // Format the 6-digit code to add visual separation
        char[] codeChars = resetCode.toCharArray();

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Password Reset</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: Arial, sans-serif;\n" +
                "            line-height: 1.6;\n" +
                "            color: #333333;\n" +
                "            max-width: 600px;\n" +
                "            margin: 0 auto;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .header {\n" +
                "            text-align: center;\n" +
                "            padding-bottom: 20px;\n" +
                "            border-bottom: 1px solid #eeeeee;\n" +
                "        }\n" +
                "        .content {\n" +
                "            padding: 20px 0;\n" +
                "        }\n" +
                "        .verification-code {\n" +
                "            text-align: center;\n" +
                "            margin: 30px 0;\n" +
                "        }\n" +
                "        .code-container {\n" +
                "            display: inline-block;\n" +
                "            margin: 0 auto;\n" +
                "            background-color: #f5f5f5;\n" +
                "            border-radius: 10px;\n" +
                "            padding: 15px 20px;\n" +
                "        }\n" +
                "        .code-digit {\n" +
                "            display: inline-block;\n" +
                "            width: 40px;\n" +
                "            height: 50px;\n" +
                "            margin: 0 5px;\n" +
                "            background-color: #ffffff;\n" +
                "            border: 1px solid #dddddd;\n" +
                "            border-radius: 5px;\n" +
                "            font-size: 24px;\n" +
                "            font-weight: bold;\n" +
                "            line-height: 50px;\n" +
                "            text-align: center;\n" +
                "            color: #333333;\n" +
                "            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n" +
                "        }\n" +
                "        .footer {\n" +
                "            margin-top: 30px;\n" +
                "            padding-top: 20px;\n" +
                "            border-top: 1px solid #eeeeee;\n" +
                "            font-size: 12px;\n" +
                "            color: #777777;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .expiration-note {\n" +
                "            font-style: italic;\n" +
                "            margin: 20px 0;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"header\">\n" +
                "        <h2>Password Reset Verification</h2>\n" +
                "    </div>\n" +
                "    <div class=\"content\">\n" +
                "        <p>Hello " + username + ",</p>\n" +
                "        <p>We received a request to reset your password. Please use the verification code below to complete the process:</p>\n"
                +
                "        \n" +
                "        <div class=\"verification-code\">\n" +
                "            <div class=\"code-container\">\n" +
                "                <div class=\"code-digit\">" + codeChars[0] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[1] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[2] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[3] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[4] + "</div>\n" +
                "                <div class=\"code-digit\">" + codeChars[5] + "</div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        \n" +
                "        <p class=\"expiration-note\">This code will expire in 15 minutes.</p>\n" +
                "        \n" +
                "        <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>\n"
                +
                "    </div>\n" +
                "    <div class=\"footer\">\n" +
                "        <p>This is an automated message, please do not reply to this email.</p>\n" +
                "        <p>&copy; " + java.time.Year.now().getValue() + " Tu Phung. All rights reserved.</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
    
    public String getTotpResetApprovedTemplate(String firstName) {
        String template = "<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "    <meta charset=\"UTF-8\">\n" +
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
            "    <title>TOTP Reset Approved</title>\n" +
            "    <style>\n" +
            "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
            "        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }\n" +
            "        .content { padding: 20px 0; }\n" +
            "        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }\n" +
            "        .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }\n" +
            "    </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <div class=\"header\">\n" +
            "        <h2>TOTP Reset Request Approved</h2>\n" +
            "    </div>\n" +
            "    <div class=\"content\">\n" +
            "        <p>Dear " + firstName + ",</p>\n" +
            "        <p>Your request to reset your two-factor authentication (TOTP) has been <strong>approved</strong>.</p>\n" +
            "        <p>Your TOTP has been reset, and you can now set up a new device by visiting your account security settings.</p>\n" +
            "        <p style=\"text-align: center; margin: 30px 0;\">\n" +
            "            <a href=\"" + applicationUrl + "/settings/security\" class=\"button\">Security Settings</a>\n" +
            "        </p>\n" +
            "        <p><strong>Important:</strong> If you did not request this reset, please contact support immediately.</p>\n" +
            "    </div>\n" +
            "    <div class=\"footer\">\n" +
            "        <p>This is an automated message, please do not reply to this email.</p>\n" +
            "        <p>&copy; " + java.time.Year.now().getValue() + " " + applicationName + ". All rights reserved.</p>\n" +
            "    </div>\n" +
            "</body>\n" +
            "</html>";
        
        return template;
    }

    public String getTotpResetRejectedTemplate(String firstName) {
        String template = "<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "    <meta charset=\"UTF-8\">\n" +
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
            "    <title>TOTP Reset Rejected</title>\n" +
            "    <style>\n" +
            "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
            "        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }\n" +
            "        .content { padding: 20px 0; }\n" +
            "        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }\n" +
            "        .support-button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }\n" +
            "    </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <div class=\"header\">\n" +
            "        <h2>TOTP Reset Request Rejected</h2>\n" +
            "    </div>\n" +
            "    <div class=\"content\">\n" +
            "        <p>Dear " + firstName + ",</p>\n" +
            "        <p>Your request to reset your two-factor authentication (TOTP) has been <strong>rejected</strong>.</p>\n" +
            "        <p>If you believe this is a mistake or if you still need assistance, please contact our support team.</p>\n" +
            "        <p style=\"text-align: center; margin: 30px 0;\">\n" +
            "            <a href=\"" + applicationUrl + "/support\" class=\"support-button\">Contact Support</a>\n" +
            "        </p>\n" +
            "    </div>\n" +
            "    <div class=\"footer\">\n" +
            "        <p>This is an automated message, please do not reply to this email.</p>\n" +
            "        <p>&copy; " + java.time.Year.now().getValue() + " " + applicationName + ". All rights reserved.</p>\n" +
            "    </div>\n" +
            "</body>\n" +
            "</html>";
        
        return template;
    }

    public String getAdminNotificationTemplate(String username, String userId, String email, String requestId) {
        String template = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>TOTP Reset Request Notification</title>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }\n"
                +
                "        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }\n" +
                "        .content { padding: 20px 0; }\n" +
                "        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }\n"
                +
                "        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n" +
                "        .info-table td { padding: 8px; border-bottom: 1px solid #eee; }\n" +
                "        .info-table td:first-child { font-weight: bold; width: 30%; }\n" +
                "        .action-button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }\n"
                +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"header\">\n" +
                "        <h2>New TOTP Reset Request</h2>\n" +
                "    </div>\n" +
                "    <div class=\"content\">\n" +
                "        <p>A new request to reset TOTP has been submitted and requires administrator review.</p>\n" +
                "        <table class=\"info-table\">\n" +
                "            <tr>\n" +
                "                <td>Username:</td>\n" +
                "                <td>" + username + "</td>\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td>User ID:</td>\n" +
                "                <td>" + userId + "</td>\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td>Email:</td>\n" +
                "                <td>" + email + "</td>\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td>Request ID:</td>\n" +
                "                <td>" + requestId + "</td>\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td>Request Time:</td>\n" +
                "                <td>" + java.time.LocalDateTime.now() + "</td>\n" +
                "            </tr>\n" +
                "        </table>\n" +
                "        <p style=\"text-align: center; margin: 30px 0;\">\n" +
                "            <a href=\"" + applicationUrl
                + "/admin/totp-reset\" class=\"action-button\">Review Request</a>\n" +
                "        </p>\n" +
                "    </div>\n" +
                "    <div class=\"footer\">\n" +
                "        <p>This is an automated message, please do not reply to this email.</p>\n" +
                "        <p>&copy; " + java.time.Year.now().getValue() + " " + applicationName
                + ". All rights reserved.</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";

        return template;
    }

}