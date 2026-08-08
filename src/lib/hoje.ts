export function obterDataDeHoje(): Date {
  const agora = new Date();
  const dataBrasil = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(agora);

  return new Date(`${dataBrasil}T00:00:00.000Z`);
}
