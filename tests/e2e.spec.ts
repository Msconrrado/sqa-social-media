import { test, expect } from "@playwright/test";

// =============================================================================
// TESTE E2E 1 — Fluxo completo de cadastro
// =============================================================================

test("E2E - Fluxo de cadastro: usuário se cadastra e é redirecionado para home", async ({ page }) => {
  const emailUnico = `teste_${Date.now()}@email.com`;
  const senha = "Senha@1234";

  // Navega para a página de cadastro
  await page.goto("/signup");
  await expect(page).toHaveURL(/signup/);

  // Preenche o campo de email
  await page.getByPlaceholder("seu@email.com").fill(emailUnico);

  // Preenche os dois campos de senha
  const camposSenha = page.getByPlaceholder("••••••••");
  await camposSenha.nth(0).fill(senha);
  await camposSenha.nth(1).fill(senha);

  // Clica no botão — .last() pega o do formulário e não o do Header
  await page.getByRole("button", { name: /criar conta/i }).last().click();

  // Aguarda redirecionamento para home
  await expect(page).toHaveURL("http://localhost:3000/");

  // Verifica botões de usuário logado no header
  await expect(page.getByText("Posts Curtidos")).toBeVisible();
  await expect(page.getByText("Sair")).toBeVisible();
});

// =============================================================================
// TESTE E2E 2 — Fluxo completo de login
// =============================================================================

test("E2E - Fluxo de login: usuário faz login e é redirecionado para home", async ({ page }) => {
  const email = `login_${Date.now()}@email.com`;
  const senha = "Senha@1234";

  // Cadastra o usuário diretamente via API para não depender do fluxo de cadastro
  // request.post() do Playwright faz chamadas HTTP sem abrir o navegador
  await page.request.post("http://localhost:8080/auth/signup", {
    data: { email, password: senha },
  });

  // -------------------------------------------------------------------------
  // PARTE 1: Testa credenciais inválidas
  // -------------------------------------------------------------------------

  // Navega para a página de login
  await page.goto("/signin");
  await expect(page).toHaveURL(/signin/);

  // Preenche email correto mas senha errada
  await page.getByPlaceholder("seu@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill("SenhaErrada@999");

  // Clica no botão Entrar — .last() evita pegar o botão do Header
  await page.getByRole("button", { name: /entrar/i }).last().click();

  // Verifica se a mensagem de erro aparece na tela
  await expect(page.getByText("Credenciais inválidas")).toBeVisible();

  // -------------------------------------------------------------------------
  // PARTE 2: Testa login com credenciais corretas
  // -------------------------------------------------------------------------

  // Limpa o campo de senha e digita a senha correta
  await page.getByPlaceholder("••••••••").clear();
  await page.getByPlaceholder("••••••••").fill(senha);

  // Clica em Entrar
  await page.getByRole("button", { name: /entrar/i }).last().click();

  // Aguarda redirecionamento para a home
  await expect(page).toHaveURL("http://localhost:3000/");

  // Verifica se o header mostra os botões de usuário logado
  await expect(page.getByText("Posts Curtidos")).toBeVisible();
  await expect(page.getByText("Sair")).toBeVisible();
});
