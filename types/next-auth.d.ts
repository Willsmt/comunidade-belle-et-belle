import type { DefaultSession } from "next-auth";
import type { Papel, StatusConta } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      status: StatusConta;
      papeis: Papel[];
      temConsentimento: boolean;
    } & DefaultSession["user"];
  }
}
