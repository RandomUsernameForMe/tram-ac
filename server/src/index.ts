import { buildApp } from "./app.ts";
import { config } from "./config.ts";

const app = buildApp();
app.listen({ port: config.port, host: "0.0.0.0" })
  .then(() => console.log(`tram-ac server on :${config.port}`))
  .catch((err) => { console.error(err); process.exit(1); });
