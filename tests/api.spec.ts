import { test, expect } from "@playwright/test";

// URL base da API — porta 8080 onde o Spring Boot roda
const API_URL = "http://localhost:8080";

// =============================================================================
// TESTE DE API 1 — POST /auth/signup com dados válidos
// =============================================================================

test("API - POST /auth/signup deve retornar 200 e dados do usuário criado", async ({ request }) => {

  // Gera email único para não conflitar com testes anteriores
  const emailUnico = `api_signup_${Date.now()}@email.com`;

  // Faz a requisição POST para o endpoint de cadastro
  const response = await request.post(`${API_URL}/auth/signup`, {
    data: {
      email: emailUnico,
      password: "Senha@1234", // senha válida: maiúscula, minúscula, número, especial, >8 chars
    },
  });

  // Verifica se o status HTTP é 200 (OK)
  expect(response.status()).toBe(200);

  // Converte o corpo da resposta para JSON
  const body = await response.json();

  // Verifica se o email retornado é o mesmo que enviamos
  expect(body.email).toBe(emailUnico);

  // Verifica se o usuário foi criado com um id numérico
  expect(body.id).toBeTruthy();
});

// =============================================================================
// TESTE DE API 2 — POST /auth/signup com e-mail duplicado (BUG capturado)
// =============================================================================

test("API - POST /auth/signup com e-mail duplicado deve retornar mensagem 'E-mail já cadastrado' [BUG]", async ({ request }) => {

  const emailDuplicado = `duplicado_${Date.now()}@email.com`;

  // Primeiro cadastro — deve funcionar normalmente
  await request.post(`${API_URL}/auth/signup`, {
    data: {
      email: emailDuplicado,
      password: "Senha@1234",
    },
  });

  // Segundo cadastro com o mesmo email — deve retornar erro 409
  const response = await request.post(`${API_URL}/auth/signup`, {
    data: {
      email: emailDuplicado,
      password: "Senha@1234",
    },
  });

  // Verifica se o status é 409 (Conflict)
  expect(response.status()).toBe(409);

  const body = await response.json();

  // FALHA ESPERADA: a API retorna "E-mail já está em uso" em vez de "E-mail já cadastrado"
  expect(body.message).toBe("E-mail já cadastrado");
});

// =============================================================================
// TESTE DE API 3 — POST /auth/signin com credenciais corretas
// =============================================================================

test("API - POST /auth/signin com credenciais válidas deve retornar 200 e dados do usuário", async ({ request }) => {

  const email = `signin_${Date.now()}@email.com`;
  const senha = "Senha@1234";

  // Primeiro cadastra o usuário
  await request.post(`${API_URL}/auth/signup`, {
    data: { email, password: senha },
  });

  // Depois tenta fazer login com as mesmas credenciais
  const response = await request.post(`${API_URL}/auth/signin`, {
    data: { email, password: senha },
  });

  // Verifica status 200
  expect(response.status()).toBe(200);

  const body = await response.json();

  // Verifica se retornou os dados corretos do usuário
  expect(body.email).toBe(email);
  expect(body.id).toBeTruthy();
});

// =============================================================================
// TESTE DE API 4 — POST /auth/signin com credenciais incorretas
// =============================================================================

test("API - POST /auth/signin com credenciais inválidas deve retornar 401 e 'Credenciais inválidas'", async ({ request }) => {

  // Tenta login com email que não existe
  const response = await request.post(`${API_URL}/auth/signin`, {
    data: {
      email: "naoexiste@email.com",
      password: "Senha@1234",
    },
  });

  // Verifica status 401 (não autorizado)
  expect(response.status()).toBe(401);

  const body = await response.json();

  // Verifica se a mensagem é exatamente a do requisito
  expect(body.message).toBe("Credenciais inválidas");
});

// =============================================================================
// TESTE DE API 5 — POST /auth/reset-password com email não cadastrado
// =============================================================================

test("API - POST /auth/reset-password com email inexistente deve retornar 404 e 'Usuário não encontrado'", async ({ request }) => {

  const response = await request.post(`${API_URL}/auth/reset-password`, {
    data: {
      email: "inexistente@email.com",
    },
  });

  // Verifica status 404
  expect(response.status()).toBe(404);

  const body = await response.json();

  // Verifica a mensagem de erro
  expect(body.message).toBe("Usuário não encontrado");
});

// =============================================================================
// TESTE DE API 6 — GET /posts deve retornar lista de posts
// =============================================================================

test("API - GET /posts deve retornar 200 e uma lista de posts", async ({ request }) => {
  
  const response = await request.get(`${API_URL}/posts`);

  // Verifica status 200
  expect(response.status()).toBe(200);

  const body = await response.json();

  // Verifica se a resposta contém posts
  expect(body).toBeTruthy();

  // Verifica se os posts têm a estrutura esperada (título e corpo)
  if (body.posts && body.posts.length > 0) {
    const primeirPost = body.posts[0];
    expect(primeirPost).toHaveProperty("title"); // deve ter título
    expect(primeirPost).toHaveProperty("body");  // deve ter corpo
  }
});
