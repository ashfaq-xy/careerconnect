// server/controllers/auth.controller.js
// PRD v2 compliance:
//   FR-AUTH-01 — OTP hashed before storage; plain OTP only in email, never persisted
//   FR-AUTH-03 — inactive account → 403
//   FR-AUTH-05 — logout needs no valid access token
//   §8         — OTP exposure mitigation

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User.model');
const { sendEmail } = require('../utils/email');

// ─── Helper: hash a plain OTP → SHA-256 hex ───────────────────────────────────
const hashOTP = (plain) =>
  crypto.createHash('sha256').update(String(plain)).digest('hex');

// ─── Helper: generate access + refresh token pair ────────────────────────────
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Generate plain OTP — only sent in email, NEVER stored
    const plainOTP  = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = hashOTP(plainOTP);                          // PRD v2 §8 — hash before storage
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);     // 10 minutes

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash: password,
      role: role || 'jobseeker',
      emailVerificationOTP:       hashedOTP,   // stored as hash
      emailVerificationOTPExpiry: otpExpiry,
    });

    // Send plain OTP in email (non-blocking) — this is the ONLY place plain OTP exists
    sendEmail({
      to:      email,
      subject: 'Verify your CareerConnect account',
      html:    `<p>Your verification OTP is: <strong>${plainOTP}</strong>. It expires in 10 minutes.</p>`,
    }).catch(console.error);

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      accessToken,
      user: {
        _id:             user._id,
        firstName:       user.firstName,
        lastName:        user.lastName,
        email:           user.email,
        role:            user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // PRD v2 FR-AUTH-03 AC: inactive account → 403
    const user = await User.findOne({ email }).select('+passwordHash +refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      accessToken,
      user: {
        _id:             user._id,
        firstName:       user.firstName,
        lastName:        user.lastName,
        email:           user.email,
        role:            user.role,
        isEmailVerified: user.isEmailVerified,
        profilePicture:  user.profilePicture,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// PRD v2 FR-AUTH-05 — does NOT require valid access token
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: '' } }
      );
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
// PRD v2 FR-AUTH-04 — returns { accessToken, user } so AuthContext can hydrate on reload
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findOne({ _id: decoded.id, refreshToken }).select('+refreshToken');
    if (!user) {
      // Token reuse detected — PRD v2 FR-AUTH-04 AC: replayed token → 401 + forced logout
      return res.status(401).json({ success: false, message: 'Token reuse detected. Please login again.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      accessToken,
      user: {
        _id:             user._id,
        firstName:       user.firstName,
        lastName:        user.lastName,
        email:           user.email,
        role:            user.role,
        isEmailVerified: user.isEmailVerified,
        profilePicture:  user.profilePicture,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────
// PRD v2 FR-AUTH-02 — OTP is stored as hash; compare hash of submitted OTP
exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const hashedOTP = hashOTP(otp);   // hash submitted OTP before DB lookup

    const user = await User.findOne({
      emailVerificationOTP:       hashedOTP,
      emailVerificationOTPExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    user.isEmailVerified           = true;
    user.emailVerificationOTP       = undefined;
    user.emailVerificationOTPExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
// PRD v2 FR-AUTH-06 — always 200, prevents email enumeration
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken       = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to:      email,
      subject: 'CareerConnect Password Reset',
      html:    `<p>Click <a href="${resetURL}">here</a> to reset your password. Expires in 30 minutes.</p>`,
    });

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
// PRD v2 FR-AUTH-07 — valid token resets password, forces re-login
exports.resetPassword = async (req, res, next) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken:       hashedToken,
      passwordResetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
    }

    user.passwordHash             = password;
    user.passwordResetToken       = undefined;
    user.passwordResetTokenExpiry = undefined;
    user.refreshToken             = undefined; // forces re-login
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) {
    next(err);
  }
};
