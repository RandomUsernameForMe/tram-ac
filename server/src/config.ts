export const config = {
  golemioKey: process.env.GOLEMIO_KEY ?? "",
  golemioBase: "https://api.golemio.cz/v2",
  port: Number(process.env.PORT ?? 3000),
};
