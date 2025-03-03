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
    
    /**
     * Sends a password reset email with a visually styled verification code
     * 
     * @param to The recipient's email address
     * @param username The recipient's username
     * @param resetCode The 6-digit verification code
     */
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
           "        <p>Thank you for registering. Please use the verification code below to verify your email address:</p>\n" +
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
               "        <p>We received a request to reset your password. Please use the verification code below to complete the process:</p>\n" +
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
               "        <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>\n" +
               "    </div>\n" +
               "    <div class=\"footer\">\n" +
               "        <p>This is an automated message, please do not reply to this email.</p>\n" +
               "        <p>&copy; " + java.time.Year.now().getValue() + " Tu Phung. All rights reserved.</p>\n" +
               "    </div>\n" +
               "</body>\n" +
               "</html>";
    }
}