# Padrões k6 para adicionar cobertura de uma feature nova

## setup() para descobrir dados reais uma vez só

```js
export function setup() {
  const res = http.get(`${BASE_URL}/api/posts`, { headers: headersAutenticado });
  const posts = res.json();
  return { postIds: posts.map((p) => p.id) };
}

export default function (data) {
  const id = data.postIds[Math.floor(Math.random() * data.postIds.length)];
  http.get(`${BASE_URL}/posts/${id}`, { tags: { name: "posts/:id" } });
}
```

`setup()` roda uma vez, fora do loop de VUs — não conta pra métrica de carga.

## Simulando um formulário (Server Action via progressive enhancement)

Um `<form action={minhaAction}>` sem JS manda um POST comum,
`application/x-www-form-urlencoded` ou `multipart/form-data`, pra própria URL
da página. É isso que o k6 deve imitar — não o protocolo interno
`Next-Action`/Flight que o React usa quando há JS (client-side transition):

```js
const res = http.post(
  `${BASE_URL}/feed/novo`,
  { texto: "post de teste" }, // k6 serializa como x-www-form-urlencoded
  { headers: headersAutenticado, redirects: 0 },
);
check(res, { "redireciona apos criar": (r) => r.status === 303 || r.status === 307 });
```

`redirects: 0` evita que o k6 siga o redirect automaticamente — assim você
mede e valida a resposta da própria action, não a página de destino (que é
outra métrica, meça-a separadamente).

## Upload de arquivo

```js
const arquivo = open("./fixtures/foto-exemplo.jpg", "b");
const res = http.post(
  `${BASE_URL}/cliente/fotos`,
  { arquivo: http.file(arquivo, "foto.jpg", "image/jpeg") },
  { headers: headersAutenticado },
);
```

Se o upload vai pra um storage externo (S3/R2), confirme que `loadtest.env`
aponta pra um bucket/credencial de teste — nunca o de produção. Se não houver
um de teste, marque a rota como `expensive` e não rode sem `--allow-expensive`.

## Tag de domínio + read/write

```js
const res = http.get(`${BASE_URL}/feed`, {
  tags: { domain: "feed", kind: "read" },
});
```

Isso permite depois filtrar o CSV/summary por domínio pra achar qual área da
aplicação pesa mais, sem precisar re-rodar o teste.

## Peso proporcional ao tráfego real

Duas formas simples, sem executor customizado:

```js
export default function () {
  const r = Math.random();
  if (r < 0.6) group("feed (60% do tráfego)", verFeed);
  else if (r < 0.9) group("perfil (30%)", verPerfil);
  else group("criar post (10%)", criarPost);
}
```

Para peso realista de verdade, puxe a proporção de um log de acesso ou do APM
do projeto em vez de chutar.

## Rota cara — guard obrigatório, tag não basta

```js
if (__ENV.ALLOW_EXPENSIVE === "1") {
  group("gerar relatorio com IA [expensive]", function () {
    http.post(`${BASE_URL}/relatorios/gerar`, {}, { headers: headersAutenticado });
  });
}
```

Sem o `if`, a tag `expensive` só documenta — não impede a rota de rodar e
gastar dinheiro/tempo de LLM a cada iteração.
