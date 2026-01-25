import passport, { Profile } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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
        console.debug('Google profile:', profile);

        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found'), undefined);
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // If user doesn't exist, we don't let them in
          // Only admins can create users manually
          return done(new Error('User not found'), undefined);
        }

        if (!user.isActive) {
          return done(new Error('User is not active'), undefined);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Required by Passport even if using JWT sessions
passport.serializeUser((user: any, done) => done(null, user.userId));
passport.deserializeUser(async (id: number, done) => {
  const user = await prisma.user.findUnique({ where: { userId: id } });
  done(null, user);
});