import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const googleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
export const microsoftAuthEnabled = Boolean(
  process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
);

/** Its `code` reaches the client on the signIn() result; login-form.tsx matches on it. */
class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

const providers: Provider[] = [];

if (googleAuthEnabled) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Linking to an existing email/password user happens in the signIn
      // callback below, which requires a verified Google email and revokes
      // sessions on accounts whose email was never verified.
    })
  );
}

if (microsoftAuthEnabled) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || "common"}/v2.0`,
    })
  );
}

providers.push(
  Credentials({
    id: "credentials",
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.password) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      // Checked after the password so it reveals nothing to someone without it.
      if (user.emailVerified === null) throw new EmailNotVerified();

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      // Only trust Google identities whose email Google has verified.
      if (!profile?.email || profile.email_verified !== true) {
        return "/login?error=AccessDenied";
      }

      // If this Google account is already linked, let Auth.js handle it.
      const linked = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      });
      if (linked) return true;

      // Link to an existing user with the same (Google-verified) email if that
      // user has no Google account yet. Auth.js then finds the linked account
      // and signs the user in instead of raising OAuthAccountNotLinked.
      const existing = await prisma.user.findUnique({
        where: { email: profile.email.toLowerCase().trim() },
        include: { accounts: { where: { provider: "google" } } },
      });
      if (existing && existing.accounts.length === 0) {
        await prisma.$transaction([
          prisma.account.create({
            data: {
              userId: existing.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state:
                typeof account.session_state === "string"
                  ? account.session_state
                  : null,
            },
          }),
          // An unverified email means whoever set the password never proved
          // ownership of it. Drop that password, mark the email verified, and
          // bump sessionVersion so every session issued before now is revoked.
          ...(existing.emailVerified === null
            ? [
                prisma.user.update({
                  where: { id: existing.id },
                  data: {
                    password: null,
                    emailVerified: new Date(),
                    sessionVersion: { increment: 1 },
                  },
                }),
              ]
            : []),
        ]);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // Microsoft sign-in sets the profile photo as a base64 data URL, which
      // pushes the session cookie past 4 KB and splits it into chunks. Nothing
      // reads the picture from the session, so keep it out of the cookie.
      delete token.picture;

      // Reject tokens issued before the user's sessionVersion was bumped.
      // Returning null clears the session cookie.
      const userId = (token.id as string | undefined) ?? token.sub;
      if (!userId) return null;
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { sessionVersion: true },
      });
      if (!current) return null;
      if (user) {
        token.sessionVersion = current.sessionVersion;
      } else if ((token.sessionVersion ?? 0) !== current.sessionVersion) {
        return null;
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
