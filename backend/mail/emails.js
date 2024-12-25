import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a transporter using Gmail's SMTP settings
const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user:"ramg8305@gmail.com", 
        pass: "jwqj mecq wkoa mwwp",
    },
	host: 'smtp.gmail.com',
    port: 587,
    secure: false,
});

export const sendVerificationEmail = async (toEmail, verificationToken) => {
    try {
        const mailOptions = {
            from: "ramg8305@gmail.com", 
            to: toEmail,                  
            subject: "Verify Your Email", 
            text: `Please use the following verification code: ${verificationToken}`, 
            html: `<p>Please use the following verification code: <strong>${verificationToken}</strong></p>`, 
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully.");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
