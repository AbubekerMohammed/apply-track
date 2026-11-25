import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          MicrosoftEntraID({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || "common"}/v2.0`,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        demoProvider: { label: "Demo Provider", type: "text" },
      },
      async authorize(credentials) {
        // Demo logins are only allowed when ENABLE_DEMO_MODE is on
        if (credentials?.demoProvider && !isDemoMode()) {
          return null;
        }

        // Support 1-click test login for Google & Microsoft accounts
        if (credentials?.demoProvider === "google") {
          const testEmail = "test.google@applytrack.io";
          let user = await prisma.user.findUnique({
            where: { email: testEmail },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: "Google Test User",
                email: testEmail,
                gmailConnected: true,
              },
            });
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        if (credentials?.demoProvider === "microsoft") {
          const testEmail = "test.microsoft@applytrack.io";
          let user = await prisma.user.findUnique({
            where: { email: testEmail },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: "Microsoft Test User",
                email: testEmail,
                outlookConnected: true,
              },
            });
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(
          String(credentials.password),
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
