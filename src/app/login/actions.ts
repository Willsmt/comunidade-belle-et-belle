"use server";

import { signIn } from "@/auth";
import { executarAction } from "@/lib/actions/executar-action";

export async function entrarComGoogle() {
  return executarAction(async () => {
    await signIn("google");
  });
}
