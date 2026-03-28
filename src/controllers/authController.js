const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
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

                // Mocking sending OTP. In 
                console.log(`[AUTH] Admin Login OTP for ${user.email} (7869147222): ${otp}`);
                
                // Note: In production you would call an SMS/Email service here.
                
                return res.json({
                    requires2FA: true,
                    userId: user.id,
                    message: 'OTP sent to your registered phone number'
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

        if (!user || user.otpCode !== otp) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
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
