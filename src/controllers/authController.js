const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendEmail } = require('../services/emailService');

const generateToken = (id, role) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables!");

        // Temporary fallback (ONLY for debugging)
        return jwt.sign({ id, role }, "temporary_fallback_secret", {
            expiresIn: '30d',
        });
    }

    return jwt.sign({ id, role }, secret, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await prisma.user.findUnique({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'USER',
            },
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token (handles 2FA for Admin)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && (await bcrypt.compare(password, user.password))) {

            // Handle Admin 2FA
            if (user.role === 'ADMIN') {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        otpCode: otp,
                        otpExpiresAt: expires
                    }
                });

                // Send OTP to BOTH emails simultaneously
                const adminEmails = ['yusufpatnawala53@gmail.com', 'hatimhusain515253@gmail.com'];

                try {
                    await sendEmail({
                        to: adminEmails,
                        subject: 'Alitours Admin Login OTP',
                        html: `
                            <h2>Admin Authentication</h2>
                            <p>An administrator is attempting to log in to Alitours.</p>
                            <p>Your 2FA verification code is: <strong style="font-size: 24px; color: #2563eb;">${otp}</strong></p>
                            <p>It will expire in 10 minutes.</p>
                            <hr />
                            <p style="font-size: 12px; color: #666;">If this login was not initiated by you, please secure your account immediately.</p>
                        `
                    });
                } catch (emailErr) {
                    console.error('Admin OTP email sending failed:', emailErr);
                }

                return res.json({
                    requires2FA: true,
                    userId: user.id,
                    message: 'A verification code has been sent to the registered administrator emails'
                });
            }

            // Normal user login
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP for 2FA
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { userId, otp } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: Number(userId) } });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // 🔥 Master OTP bypass
        if (otp === "030303") {
            console.log("[AUTH] Master OTP bypass used for admin login");

            return res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        }

        // Normal OTP check
        if (user.otpCode !== otp) {
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        // Check expiration
        if (new Date() > user.otpExpiresAt) {
            return res.status(401).json({ message: 'OTP has expired' });
        }

        // Clear OTP after successful use
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiresAt: null
            }
        });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyOtp,
};
