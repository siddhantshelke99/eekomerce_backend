import { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterBody, LoginBody, RefreshTokenBody } from './auth.schema.js';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_PATH = '/api/v1/auth';
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

export class AuthController {
  constructor(private authService: AuthService) {}

  registerHandler = async (
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ) => {
    const result = await this.authService.register(request.body);
    return reply.status(201).send({
      success: true,
      data: result,
    });
  };

  loginHandler = async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) => {
    const { accessToken, refreshToken, user } = await this.authService.login(
      request.body,
      (payload) => request.server.jwt.sign(payload)
    );

    reply.setCookie('refreshToken', refreshToken, {
      path: COOKIE_PATH,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SEVEN_DAYS_IN_SECONDS,
    });

    return reply.status(200).send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  };

  googleLoginHandler = async (
    request: FastifyRequest<{ Body: { email: string; name: string; googleId: string } }>,
    reply: FastifyReply
  ) => {
    const { accessToken, refreshToken, user } = await this.authService.googleLogin(
      request.body,
      (payload) => request.server.jwt.sign(payload)
    );

    reply.setCookie('refreshToken', refreshToken, {
      path: COOKIE_PATH,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SEVEN_DAYS_IN_SECONDS,
    });

    return reply.status(200).send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  };

  refreshTokenHandler = async (
    request: FastifyRequest<{ Body?: RefreshTokenBody }>,
    reply: FastifyReply
  ) => {
    const headerToken = request.headers['x-refresh-token'] as string | undefined;
    const bodyToken = request.body?.refreshToken;
    const cookieToken = request.cookies.refreshToken;

    const refreshTokenRaw = cookieToken || bodyToken || headerToken;

    const { accessToken } = await this.authService.refreshToken(
      refreshTokenRaw,
      (payload) => request.server.jwt.sign(payload)
    );

    return reply.status(200).send({
      success: true,
      data: {
        accessToken,
      },
    });
  };

  logoutHandler = async (
    request: FastifyRequest<{ Body?: RefreshTokenBody }>,
    reply: FastifyReply
  ) => {
    const headerToken = request.headers['x-refresh-token'] as string | undefined;
    const bodyToken = request.body?.refreshToken;
    const cookieToken = request.cookies.refreshToken;

    const refreshTokenRaw = cookieToken || bodyToken || headerToken;
    await this.authService.logout(refreshTokenRaw);

    reply.clearCookie('refreshToken', {
      path: COOKIE_PATH,
    });

    return reply.status(200).send({
      success: true,
      message: 'Logged out successfully',
    });
  };
}
