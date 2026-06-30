import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/modals/User";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // passed from LoginForm ("admin" | "employee")
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password.");
        }

        const { email, password } = credentials;

        // 1. Check if login matches Admin credentials in environment variables
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (
          adminEmail &&
          adminPassword &&
          email.toLowerCase() === adminEmail.toLowerCase() &&
          password === adminPassword
        ) {
          return {
            id: "admin-system-id",
            name: "System Admin",
            email: adminEmail,
            role: "admin",
          };
        }

        // 2. Fallback to MongoDB lookup
        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          throw new Error("No user found with this email.");
        }

        // Compare password with hashed database password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user._id.toString(),
          name: user.name || "Employee",
          email: user.email,
          role: user.role || "employee",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Path containing your login component
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };