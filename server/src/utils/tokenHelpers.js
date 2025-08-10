import jwt from 'jsonwebtoken';
import Token from '../models/Token.js';

const generateTokens = async (userId) => {
  try {
    // Create access token
    const accessToken = jwt.sign(
      { id: userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    // Calculate expiry time for database
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRY));

    // Save refresh token in database
    await Token.findOneAndUpdate(
      { userId },
      {
        refreshToken: refreshToken,
        expiresAt: expiryDate,
        isActive: true
      },
      { upsert: true, new: true }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new Error('Failed to generate authentication tokens');
  }
};

const generateAdminTokens = async (userId, role) => {
  try {
    // Create access token
    const accessToken = jwt.sign(
      { id: userId, role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { id: userId, role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    // Calculate expiry time for database
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRY));

    // Save refresh token in database
    await Token.findOneAndUpdate(
      { userId },
      {
        refreshToken: refreshToken,
        expiresAt: expiryDate,
        isActive: true
      },
      { upsert: true, new: true }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new Error(`Failed to generate admin's authentication tokens`);
  }
};

export { generateTokens, generateAdminTokens };