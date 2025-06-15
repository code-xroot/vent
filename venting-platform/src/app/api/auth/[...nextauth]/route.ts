// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials'; // Import CredentialsProvider
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs'; // Import bcryptjs
import { User as DbUser } from '@/lib/types/user'; // Assuming you might create a specific User type for DB schema if needed

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Invalid/Missing environment variable: "NEXTAUTH_SECRET"');
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  // Keep this check if Google provider is still active
  console.warn('Missing Google OAuth credentials. Google Sign-In will not work if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set. This warning can be removed if Google provider is disabled.');
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Email and password are required.');
        }

        const client = await clientPromise;
        const db = client.db();
        // The users collection is typically managed by NextAuth adapter.
        // It might store users from Google and Credentials differently if not careful.
        // Default adapter stores users in a 'users' collection.
        const user = await db.collection<DbUser>('users').findOne({ email: credentials.email });

        if (!user) {
          // User not found
          throw new Error('No user found with this email.');
        }

        // Check if the user signed up with a different method (e.g. Google) and doesn't have a password
        if (!user.hashedPassword) {
            throw new Error('This account was created using a different sign-in method. Try Google Sign-In.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isValidPassword) {
          // Invalid password
          throw new Error('Incorrect password.');
        }

        // Return user object if everything is fine
        // Ensure the returned object matches NextAuth's expected User type for sessions
        return {
            id: user._id.toString(), // Use ._id from MongoDB document
            name: user.name,
            email: user.email,
            image: user.image
            // Any other properties you want in the session user object
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    // error: '/auth/error', // You can define an error page
  },
  session: {
    strategy: 'database', // Using 'database' to store sessions, good for Credentials provider
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      // 'user' object here is from the authorize callback or from the adapter after social login
      if (session.user) {
        session.user.id = user.id; // user.id is already correctly mapped by this point
      }
      return session;
    },
    // Optional: jwt callback if using JWT strategy (we are using 'database' strategy)
    // async jwt({ token, user }) {
    //   if (user) {
    //     token.id = user.id;
    //   }
    //   return token;
    // }
  },
  // debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
