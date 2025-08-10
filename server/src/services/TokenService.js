import BaseService from './BaseService.js';
import Token from '../models/Token.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class TokenService extends BaseService {
  constructor() {
    super(Token);
  }

  // Generate access token
  generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET || 'access-secret',
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
  }

  // Generate refresh token
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Create token pair
  async createTokenPair(userId, deviceInfo = {}) {
    try {
      const accessToken = this.generateAccessToken({ userId });
      const refreshToken = this.generateRefreshToken();

      // Save refresh token to database
      const tokenDoc = await this.create({
        userId,
        refreshToken,
        deviceInfo,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      return {
        accessToken,
        refreshToken: tokenDoc.refreshToken,
        accessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        refreshTokenExpiry: tokenDoc.expiresAt
      };
    } catch (error) {
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }

  // Verify and refresh tokens
  async refreshTokens(refreshToken, deviceInfo = {}) {
    try {
      const tokenDoc = await this.findOne({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        throw new Error('Invalid or expired refresh token');
      }

      // Deactivate old token
      await this.updateById(tokenDoc._id, { isActive: false });

      // Create new token pair
      return await this.createTokenPair(tokenDoc.userId, deviceInfo);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Revoke token
  async revokeToken(refreshToken) {
    try {
      return await this.model.updateOne(
        { refreshToken },
        { isActive: false }
      );
    } catch (error) {
      throw new Error(`Token revocation failed: ${error.message}`);
    }
  }

  // Revoke all user tokens
  async revokeAllUserTokens(userId) {
    try {
      return await this.bulkUpdate(
        { userId, isActive: true },
        { isActive: false }
      );
    } catch (error) {
      throw new Error(`Token revocation failed: ${error.message}`);
    }
  }

  // Get user active sessions
  async getUserActiveSessions(userId) {
    try {
      return await this.findAll({
        filter: {
          userId,
          isActive: true,
          expiresAt: { $gt: new Date() }
        },
        select: 'deviceInfo createdAt expiresAt',
        sort: { createdAt: -1 }
      });
    } catch (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  // Clean expired tokens
  async cleanExpiredTokens() {
    try {
      return await this.bulkDelete({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { isActive: false }
        ]
      });
    } catch (error) {
      throw new Error(`Token cleanup failed: ${error.message}`);
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret');
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}

export default new TokenService();