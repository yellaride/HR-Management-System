import NextAuth, { AuthOptions, DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/modals/User";

// Module Declaration Merging to ensure TypeScript works cleanly
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "employee";
    } & DefaultSession["user"];
    error?: string;
  }

  interface User {
    id: string;
    role: "admin" | "employee";
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "admin" | "employee";
    tokenVersion?: number;
    lastChecked?: number;
    error?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password.");
        }

        const { email, password } = credentials;

        let user: any = null;
        try {
          // Always authenticate against MongoDB
          await dbConnect();
          user = await User.findOne({ email: email.toLowerCase() });
        } catch (err: any) {
          const msg = String(err?.message || err || "");
          const looksLikeMongoDown =
            /ECONNREFUSED|ECONNRESET|MongoNetworkError|MongoError|ETIMEDOUT|timed out|failed to connect/i.test(msg);

          if (looksLikeMongoDown) {
            throw new Error("Service unavailable. Please try again in a moment.");
          }

          // Fall back to generic message without leaking internals
          throw new Error("Service unavailable. Please try again in a moment.");
        }

        // Avoid leaking whether user exists or not
        if (!user) {
          throw new Error("Invalid email or password.");
        }

        // Compare password with hashed database password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Invalid email or password.");
        }

        // Role and tokenVersion are extracted strictly from the database
        return {
          id: user._id.toString(),
          name: user.name || "Employee",
          email: user.email,
          role: user.role || "employee",
          tokenVersion: user.tokenVersion || 0, // Pass tokenVersion from DB to JWT
        }; // <-- Closes returned object
      }, // <-- Closes authorize function
    }), // <-- Closes CredentialsProvider
  ], // <-- Closes providers array
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial Sign-In: Populate JWT token with database fields
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.tokenVersion = user.tokenVersion ?? 0;
        token.lastChecked = Date.now();
        return token;
      }

      // 2. Periodically re-validate user status and token version in database
      // Checked every 5 minutes (300000ms) to maintain database efficiency
      const THROTTLE_TIME = 5 * 60 * 1000; 
      const now = Date.now();
      const lastChecked = token.lastChecked || 0;

      if (now - lastChecked > THROTTLE_TIME) {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id).select("role tokenVersion");
          const dbTokenVersion = dbUser?.tokenVersion ?? 0;
          const currentTokenVersion = token.tokenVersion ?? 0;

          // If user was deleted, or tokenVersion was incremented (from another device's global logout)
          if (!dbUser || dbTokenVersion !== currentTokenVersion) {
            token.error = "SessionExpired";
            delete token.id; // Strip ID to signal an invalid session
          } else {
            // Keep token details up to date with DB changes
            token.role = dbUser.role || "employee";
            token.tokenVersion = dbTokenVersion;
            token.lastChecked = now;
          }
        } catch (error) {
          console.error("Failed to dynamic check JWT validity:", error);
          // Silently fail to protect UI if DB is temporarily busy
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && token.id && !token.error) {
        session.user.id = token.id;
        session.user.role = token.role || "employee";
        session.user.name = token.name;
        session.user.email = token.email;
      } else {
        // Clear user properties if the token is stripped, forcing unauthenticated state
        session.user = undefined as any;
        if (token?.error) {
          session.error = token.error;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/", 
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };