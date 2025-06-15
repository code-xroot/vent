// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
// Remove EmailProvider import if no longer used
// import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google'; // Add GoogleProvider import
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

// Comment out or remove email server warnings if EmailProvider is removed
// if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD || !process.env.EMAIL_FROM) {
//   console.warn("Email server environment variables are not fully set. Magic links might be logged to console if using a development email server.");
// }

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Invalid/Missing environment variable: "NEXTAUTH_SECRET"');
}

// Add checks for Google credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // Remove or comment out EmailProvider configuration
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: Number(process.env.EMAIL_SERVER_PORT),
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    // }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string, // Cast as string
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, // Cast as string
      // You can add authorization scope options here if needed, e.g.
      // authorization: {
      //   params: {
      //     prompt: "consent",
      //     access_type: "offline",
      //     response_type: "code"
      //   }
      // }
    }),
  ],
  pages: {
    signIn: '/auth/signin', // Your custom sign-in page path
    // verifyRequest: '/auth/verify-request', // No longer needed if EmailProvider is removed
    // error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      // Send properties to the client, like user id from the user object.
      // The user object is what's stored in the database.
      if (session.user) {
        session.user.id = user.id; // Add id to session user object
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
