import { config } from "dotenv";

// override: false — em CI o DATABASE_URL já vem setado como env do job,
// esse dotenv só preenche localmente via .env.test se existir, sem sobrescrever.
config({ path: ".env.test", override: false });
