import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { obterPost } from "../../queries";
import { FormularioEditarPost } from "./formulario-editar-post";

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
    <section>
      <h1>Editar post</h1>
      <FormularioEditarPost postId={post.id} texto={post.texto ?? ""} />
    </section>
  );
}
