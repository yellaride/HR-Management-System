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

        // Always authenticate against MongoDB (admin is also stored in DB)
        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase() });



        // Validate role chosen on the login form (admin vs employee)


        const expectedRole = credentials.role;
        if (!expectedRole || (expectedRole !== "admin" && expectedRole !== "employee")) {
          throw new Error("Invalid role.");
        }

        if (!user) {
          throw new Error("No user found with this email.");
        }

        if (user.role !== expectedRole) {
          throw new Error("Invalid email or password.");
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
        const u = user as { id: string; role: "admin" | "employee"; name?: string; email?: string };
        token.id = u.id;
        token.role = u.role;
        token.name = u.name;
        token.email = u.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "admin" | "employee") || "employee";
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
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