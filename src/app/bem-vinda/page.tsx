"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { aceitarTermo } from "./actions";
import { sair } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function BemVindaPage() {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleAceitar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aceitarTermo();
        await update();
        router.refresh();
      } catch {
        setErro(
          "Não foi possível registrar seu aceite. Tenta de novo em alguns segundos.",
        );
      }
    });
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <span className="font-heading text-2xl text-foreground">Belle et Belle</span>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-heading text-xl text-foreground">Bem-vinda à comunidade!</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Que bom ter você aqui. Antes de continuar, dá uma lida no termo abaixo.
          </p>
          <section
            aria-label="Termo de consentimento"
            className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground"
          >
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="font-heading text-sm text-foreground">
                  1. Quem trata os seus dados
                </h2>
                <p className="mt-1">
                  A Comunidade Belle et Belle é operada por Patrícia Almeida
                  (Belle et Belle), responsável pelo tratamento dos dados
                  pessoais tratados nesta plataforma. Para assuntos de
                  privacidade, entre em contato pelo e-mail
                  willmarthins@gmail.com.
                </p>
                <p className="mt-1">
                  ⚠️ Pendente: CPF/CNPJ ou razão social — a preencher após
                  revisão jurídica.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  2. Quais dados coletamos
                </h2>
                <p className="mt-1">
                  Ao usar a Comunidade Belle et Belle, tratamos:
                </p>
                <ul className="mt-1 list-disc pl-4">
                  <li>
                    Dados de conta: nome, e-mail e foto de perfil fornecidos
                    pela sua conta Google no login.
                  </li>
                  <li>
                    Dados de perfil: nome de exibição, biografia e foto de
                    perfil que você opcionalmente cadastrar.
                  </li>
                  <li>
                    Medidas corporais: peso, cintura, quadril, braço e coxa,
                    registrados por você para acompanhamento próprio e uso
                    pelas parcerias vinculadas a você.
                  </li>
                  <li>
                    Fotos de evolução corporal: fotos de &quot;antes/depois&quot; que
                    você escolhe enviar, usadas para acompanhar sua jornada
                    nos desafios. Este é um dado sensível de saúde e só é
                    tratado com seu consentimento explícito no momento do
                    envio.
                  </li>
                  <li>
                    Conteúdo que você publica: posts, comentários e
                    reflexões que você escreve na comunidade.
                  </li>
                  <li>
                    Dados de participação: marcações de desafios, pontuação,
                    emblemas conquistados.
                  </li>
                  <li>
                    Planos recebidos: arquivos de treino e dieta enviados a
                    você pelas parcerias (nutrição, personal trainer)
                    vinculadas à sua conta.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  3. Para que usamos esses dados
                </h2>
                <ul className="mt-1 list-disc pl-4">
                  <li>
                    Viabilizar seu acesso e uso da comunidade (login,
                    aprovação de entrada, funcionamento do feed e dos
                    desafios).
                  </li>
                  <li>
                    Permitir que as parcerias vinculadas a você
                    (nutricionista, personal trainer) acompanhem suas
                    medidas e te enviem planos personalizados.
                  </li>
                  <li>
                    Exibir seu perfil público conforme as opções de
                    visibilidade que você mesma escolhe (mostrar bio,
                    emblemas, medidas — cada uma é uma opção separada que
                    você liga ou desliga).
                  </li>
                  <li>
                    Calcular rankings e conquistas dentro dos desafios da
                    comunidade.
                  </li>
                  <li>
                    Permitir que a administração (Patrícia Almeida e
                    equipe) aprove novos membros e mantenha a comunidade
                    funcionando com segurança.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  4. Com quem seus dados são compartilhados
                </h2>
                <ul className="mt-1 list-disc pl-4">
                  <li>
                    Parcerias vinculadas a você (nutrição, personal
                    trainer): veem suas medidas e podem te enviar planos.
                    Só têm acesso se houver um vínculo formal criado pela
                    administração — nenhuma parceria vê dados de clientes
                    não vinculadas a ela.
                  </li>
                  <li>
                    Outras clientes da comunidade: veem apenas o que você
                    optar por deixar público no seu perfil (bio, emblemas,
                    medidas — cada item é uma escolha sua), além do que
                    você publicar no feed.
                  </li>
                  <li>
                    Administração (Patrícia Almeida / gestoras): tem
                    acesso a dados necessários para aprovar contas e
                    administrar a comunidade.
                  </li>
                </ul>
                <p className="mt-1">
                  Seus dados nunca são vendidos, nem compartilhados com
                  terceiros fora da plataforma para fins de marketing ou
                  publicidade.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  5. Seus direitos
                </h2>
                <p className="mt-1">Você pode, a qualquer momento:</p>
                <ul className="mt-1 list-disc pl-4">
                  <li>Acessar os dados que temos sobre você.</li>
                  <li>
                    Corrigir dados incompletos, inexatos ou desatualizados
                    (diretamente na tela de perfil, para a maior parte dos
                    casos).
                  </li>
                  <li>
                    Excluir suas fotos individualmente — a exclusão remove
                    o arquivo de verdade do armazenamento, não é só uma
                    marcação de &quot;apagado&quot; no sistema.
                  </li>
                  <li>
                    Revogar este consentimento e solicitar a exclusão da
                    sua conta. Ao excluir a conta, seus dados pessoais e
                    arquivos são removidos permanentemente em até 30 dias
                    após a solicitação. ⚠️ Pendente de revisão jurídica:
                    se algum dado precisa ser retido por obrigação legal
                    além desse prazo.
                  </li>
                  <li>
                    Retirar sua participação dos desafios a qualquer
                    momento, sem perder acesso à comunidade.
                  </li>
                  <li>Solicitar portabilidade dos seus dados.</li>
                </ul>
                <p className="mt-1">
                  Para exercer qualquer um desses direitos, entre em
                  contato através de: willmarthins@gmail.com.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  6. Como pedimos consentimento
                </h2>
                <p className="mt-1">
                  Pedimos seu consentimento separadamente para cada tipo de
                  dado sensível:
                </p>
                <ul className="mt-1 list-disc pl-4">
                  <li>
                    Ao enviar uma foto de evolução corporal, você confirma
                    que quer compartilhá-la para fins de acompanhamento do
                    desafio.
                  </li>
                  <li>
                    Cada opção de visibilidade do perfil (bio, emblemas,
                    medidas) é uma escolha individual sua, desligada por
                    padrão.
                  </li>
                  <li>
                    Este termo geral cobre o uso básico da plataforma; ele
                    não substitui as confirmações específicas acima.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  7. Segurança
                </h2>
                <p className="mt-1">
                  Seus dados ficam armazenados em provedores com práticas
                  de segurança reconhecidas (banco de dados criptografado
                  em trânsito, arquivos de imagem em armazenamento privado
                  com acesso temporário e controlado). O acesso aos seus
                  dados dentro da plataforma é restrito por papel: só
                  você, as parcerias vinculadas a você e a administração
                  têm acesso, cada um dentro do que é necessário para sua
                  função.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-sm text-foreground">
                  8. Atualizações deste termo
                </h2>
                <p className="mt-1">
                  Este termo pode ser atualizado. Mudanças relevantes
                  serão comunicadas antes de entrarem em vigor, e seu uso
                  continuado da plataforma após a comunicação representa
                  aceite dos novos termos.
                </p>
              </div>
            </div>
          </section>
          <Button type="button" onClick={handleAceitar} disabled={isPending} className="w-full">
            {isPending ? "Registrando..." : "Aceito, continuar"}
          </Button>
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="w-full text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Sair
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
