
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";

import { dbConnect } from "./db";
import { UserModel } from "@/models/User.model";

// Generate a unique username for OAuth users
async function generateUsername(name: string) {
  const baseUsername =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 40) || "user";

  let username = baseUsername;
  let count = 1;

  while (await UserModel.exists({ username })) {
    username = `${baseUsername}${count}`;
    count++;
  }

  return username;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        await dbConnect();

        const username = credentials.username as string;
        const password = credentials.password as string;

        if (!username || !password) {
          return null;
        }

        const user = await UserModel.findOne({
          $or: [
            { username },
            { email: username.toLowerCase() },
          ],
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
        };
      },
    }),

    GitHub({
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, account }) {

      // Credentials login
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.provider = "credentials";
      }

      // Google / GitHub login
      if (
        account &&
        ["google", "github"].includes(account.provider)
      ) {
        await dbConnect();

        // Check whether this OAuth account already exists
        let dbUser = await UserModel.findOne({
          accounts: {
            $elemMatch: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        // First-time OAuth login
        if (!dbUser) {
          if (!user.email) {
            throw new Error(
              "Your OAuth provider did not provide an email address."
            );
          }

          const email = user.email.toLowerCase();

          // Do not automatically link accounts just because emails match
          const existingEmailUser = await UserModel.findOne({ email });

          if (existingEmailUser) {
            throw new Error(
              "An account with this email already exists. Sign in using your existing account first."
            );
          }

          const username = await generateUsername(
            user.name || email.split("@")[0]
          );

          dbUser = await UserModel.create({
            email,
            username,
            accounts: [
              {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            ],
          });
        }

        // Always use the MongoDB ObjectId
        token.id = dbUser._id.toString();
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
