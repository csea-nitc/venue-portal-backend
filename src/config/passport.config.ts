import passport, { Profile } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '../generated/prisma/client.js';
import 'dotenv/config';

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken: String, refreshToken: String, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found'), undefined);
        }

        let user: Express.User = await prisma.user.findUnique({
          where: { email },
          select: {
            userId: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          }
        });

        if (!user) {
          // If user doesn't exist, we don't let them in
          // Only admins can create users manually
          return done(new Error('User not found'), undefined);
        }

        if (!user.isActive) {
          return done(new Error('User is not active'), undefined);
        }

        console.debug('Authenticated user:', user);
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    
    async (jwtPayload, done) => {
      try {
        const user = jwtPayload;

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
)