/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "lottie-web/build/player/lottie_light" {
  import lottie from "lottie-web";
  export default lottie;
}
