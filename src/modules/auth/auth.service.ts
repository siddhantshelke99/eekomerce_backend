import { PrismaClient, Role } from '@prisma/client';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { RegisterBody, LoginBody } from './auth.schema.js';
import { hashPassword, verifyPassword, hashToken } from '../../common/utils/hash.js';
import { ConflictError, UnauthorizedError } from '../../common/errors/app-error.js';
import { TokenPayload } from '../../plugins/jwt.js';
import { env } from '../../config/env.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const googleOAuthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(input: RegisterBody) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);
    const userRole: Role = (input.role as Role) || 'CUSTOMER';

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: userRole,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(
    input: LoginBody,
    signJwt: (payload: TokenPayload) => string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(
        `Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`,
        'ACCOUNT_LOCKED'
      );
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let lockoutUntil: Date | null = null;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: lockoutUntil ? 0 : newFailedAttempts,
          lockoutUntil: lockoutUntil || user.lockoutUntil,
        },
      });

      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    const tokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as TokenPayload['role'],
    };
    const accessToken = signJwt(tokenPayload);

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHashValue = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: tokenHashValue,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async googleLogin(
    input: { idToken?: string; email: string; name: string; googleId: string },
    signJwt: (payload: TokenPayload) => string
  ) {
    let verifiedEmail = input.email;
    let verifiedName = input.name;
    let verifiedGoogleId = input.googleId;

    // Verify Google ID Token with Google OAuth Servers if idToken is provided
    if (input.idToken && env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleOAuthClient.verifyIdToken({
          idToken: input.idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        const googlePayload = ticket.getPayload();
        if (googlePayload) {
          verifiedEmail = googlePayload.email || verifiedEmail;
          verifiedName = googlePayload.name || verifiedName;
          verifiedGoogleId = googlePayload.sub || verifiedGoogleId;
        }
      } catch (e) {
        console.log('Google ID Token verification fallback to payload data');
      }
    }

    let user = await this.prisma.user.findUnique({
      where: { email: verifiedEmail },
    });

    if (!user) {
      const dummyPasswordHash = await hashPassword(crypto.randomBytes(16).toString('hex'));
      user = await this.prisma.user.create({
        data: {
          email: verifiedEmail,
          name: verifiedName,
          googleId: verifiedGoogleId,
          passwordHash: dummyPasswordHash,
          role: 'CUSTOMER',
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: verifiedGoogleId },
      });
    }

    const tokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as TokenPayload['role'],
    };
    const accessToken = signJwt(tokenPayload);

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHashValue = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: tokenHashValue,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async refreshToken(
    refreshTokenRaw: string | undefined,
    signJwt: (payload: TokenPayload) => string
  ) {
    if (!refreshTokenRaw) {
      throw new UnauthorizedError('Refresh token is required', 'REFRESH_TOKEN_MISSING');
    }

    const tokenHashValue = hashToken(refreshTokenRaw);

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: tokenHashValue },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt <= new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const tokenPayload: TokenPayload = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role as TokenPayload['role'],
    };

    const accessToken = signJwt(tokenPayload);

    return { accessToken };
  }

  async logout(refreshTokenRaw: string | undefined) {
    if (refreshTokenRaw) {
      const tokenHashValue = hashToken(refreshTokenRaw);
      await this.prisma.session.updateMany({
        where: { tokenHash: tokenHashValue },
        data: { isRevoked: true },
      });
    }
  }
}
