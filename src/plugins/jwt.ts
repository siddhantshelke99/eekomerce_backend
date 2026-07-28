import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../common/errors/app-error.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'SUPER_ADMIN';
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  await fastify.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: {
      expiresIn: '15m',
    },
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch (err) {
        throw new UnauthorizedError('Invalid or expired access token', 'TOKEN_INVALID');
      }
    }
  );
};

export default fp(jwtPlugin, {
  name: 'jwt',
});
