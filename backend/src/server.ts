import { env } from "@/config/env";
import { createApp } from "./app";

createApp().listen(env.port, () => {
  console.log(`RASAM API listening on http://localhost:${env.port}`);
});
