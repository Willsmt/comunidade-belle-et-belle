"use server";

import { signIn } from "@/auth";

export async function entrarComGoogle() {
  await signIn("google");
}
