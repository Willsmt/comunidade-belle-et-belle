import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { obterPost } from "../../queries";
import { editarPost } from "../../actions";

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

      <form action={editarPost}>
        <input type="hidden" name="postId" value={post.id} />

        <label>
          Texto
          <textarea name="texto" rows={4} defaultValue={post.texto ?? ""} />
        </label>

        <label>
          Trocar imagem (opcional)
          <input
            type="file"
            name="arquivo"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>

        <button type="submit">Salvar</button>
      </form>
    </section>
  );
}
