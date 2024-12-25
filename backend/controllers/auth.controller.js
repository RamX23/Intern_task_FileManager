import bcryptjs from "bcryptjs";
import crypto from "crypto";
import client from "../db/connectDB.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
	sendVerificationEmail,
} from "../mail/emails.js";
import {findUser,insertUser,VerifyUser} from '../db/connectDB.js'


export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Validate input
        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        // Check if the user already exists using the PostgreSQL findUser function
        const userExists = await findUser({ email }, res);
        
        // If user already exists, findUser sends the response, so we don't need to do anything more here.
        if (userExists)  return res.status(400).json({ success: false, message: "User already exists" });

        const hashedPassword = await bcryptjs.hash(password, 10);

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
		const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();


        const newUser = {
            username: name,
            email,
            password: hashedPassword,
			verificationToken,
			verificationTokenExpiresAt
        };

        await insertUser(newUser);  

        generateTokenAndSetCookie(res, email);

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        // Send success response
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                email,
                name,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { code } = req.body;
   const currTime=new Date().toISOString();
    try {
        const query = `
            SELECT * FROM users 
            WHERE verificationtoken = $1 AND verificationTokenExpiresAt > $2
        `;
        const result = await client.query(query, [code,currTime]);

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

		const user = result.rows[0];
		await VerifyUser(code,user.email);
        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                email: user.email,
                name: user.username,
            },
        });

    } catch (error) {
        console.log("error in verifyEmail ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await client.query(query, [email]);

        const user = result.rows[0];
        
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        generateTokenAndSetCookie(res, user.id);

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user,
                password: undefined,  
            },
        });
    } catch (error) {
        console.log("Error in login", error);
        res.status(400).json({ success: false, message: error.message });
    }
};


export const logout = async (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
		}

		// update password
		const hashedPassword = await bcryptjs.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};


export const checkAuth = async (req, res) => {
	try {

		const { userId } = req;

		if (isNaN(userId)) {
			return res.status(400).json({ success: false, message: "Invalid user ID format" });
		}


		const query = 'SELECT id, email, username FROM users WHERE id = $1';
		const result = await client.query(query, [userId]);

		if (result.rows.length === 0) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		const user = result.rows[0];

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

