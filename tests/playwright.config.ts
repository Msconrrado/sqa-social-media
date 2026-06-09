import { defineConfig } from "@playwright/test";

export default defineConfig({
  // Pasta onde ficam os arquivos de teste
  testDir: "./",

  // Timeout de 30 segundos por teste
  timeout: 30000,

  // Configuração do reporter — mostra resultado no terminal de forma legível
  reporter: "list",

  use: {
    // URL base da aplicação frontend
    baseURL: "http://localhost:3000",

    // Captura screenshot automaticamente quando um teste falha
    screenshot: "only-on-failure",

    // Aguarda a página carregar completamente antes de interagir
    actionTimeout: 10000,
  },
});
