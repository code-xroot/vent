import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD || !process.env.EMAIL_FROM) {
  console.warn("Email server environment variables are not fully set. Magic links might be logged to console if using a development email server.");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Invalid/Missing environment variable: "NEXTAUTH_SECRET"');
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // sendVerificationRequest: async ({ identifier: email, url, provider: { server, from } }) => {
      //   // TODO: Implement actual email sending logic here if not using a mock/dev server
      //   console.log(`Magic link for ${email}: ${url}`);
      // }
    }),
  ],
  pages: {
    signIn: '/auth/signin', // A custom sign-in page path
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // error: '/auth/error', // Error code passed in query string as ?error=
  },
  session: {
    strategy: 'database', // Use database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  // callbacks: {
  //   async session({ session, user }) {
  //     // Send properties to the client, like an access_token and user id from a provider.
  //     session.userId = user.id;
  //     return session;
  //   }
  // }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
