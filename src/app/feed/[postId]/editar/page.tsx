import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { obterPost } from "../../queries";
import { FormularioEditarPost } from "./formulario-editar-post";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditarPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const session = await auth();
  const post = await obterPost(postId);

  if (!post || !session?.user || post.autorId !== session.user.id) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-heading text-2xl text-foreground">Editar post</h1>
      <Card className="mt-4">
        <CardContent>
          <FormularioEditarPost postId={post.id} texto={post.texto ?? ""} />
        </CardContent>
      </Card>
    </main>
  );
}
