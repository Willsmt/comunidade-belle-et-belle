import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { enrichSession } from "@/lib/auth/enrich-session";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          status: true,
          papeis: { select: { papel: true } },
          consentimento: { select: { id: true } },
        },
      });

      return enrichSession(session, user.id, dbUser);
    },
  },
});
