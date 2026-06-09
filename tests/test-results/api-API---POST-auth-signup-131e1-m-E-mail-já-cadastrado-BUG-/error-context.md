# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API - POST /auth/signup com e-mail duplicado deve retornar mensagem 'E-mail já cadastrado' [BUG]
- Location: api.spec.ts:77:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "E-mail já cadastrado"
Received: "E-mail já está em uso"
```

# Test source

```ts
  17  |  * Para rodar estes testes, é necessário que esteja rodando:
  18  |  * - Backend: cd api && ./mvnw spring-boot:run (porta 8080)
  19  |  *
  20  |  * ENDPOINTS TESTADOS:
  21  |  * - POST /auth/signup  → cadastro de usuário
  22  |  * - POST /auth/signin  → login de usuário
  23  |  * - POST /auth/reset-password → redefinição de senha
  24  |  * - GET  /posts        → listagem de posts
  25  |  */
  26  | 
  27  | import { test, expect } from "@playwright/test";
  28  | 
  29  | // URL base da API — porta 8080 onde o Spring Boot roda
  30  | const API_URL = "http://localhost:8080";
  31  | 
  32  | // =============================================================================
  33  | // TESTE DE API 1 — POST /auth/signup com dados válidos
  34  | // =============================================================================
  35  | 
  36  | test("API - POST /auth/signup deve retornar 200 e dados do usuário criado", async ({ request }) => {
  37  |   /**
  38  |    * O que este teste valida:
  39  |    * Ao enviar email e senha válidos, a API deve:
  40  |    * - Retornar status HTTP 200 (sucesso)
  41  |    * - Retornar o objeto do usuário criado com o email informado
  42  |    *
  43  |    * Requisito: "O sistema deve permitir que um novo usuário se cadastre
  44  |    *             com um e-mail válido e uma senha forte."
  45  |    *
  46  |    * request.post() é o método do Playwright para fazer requisições HTTP POST
  47  |    */
  48  | 
  49  |   // Gera email único para não conflitar com testes anteriores
  50  |   const emailUnico = `api_signup_${Date.now()}@email.com`;
  51  | 
  52  |   // Faz a requisição POST para o endpoint de cadastro
  53  |   const response = await request.post(`${API_URL}/auth/signup`, {
  54  |     data: {
  55  |       email: emailUnico,
  56  |       password: "Senha@1234", // senha válida: maiúscula, minúscula, número, especial, >8 chars
  57  |     },
  58  |   });
  59  | 
  60  |   // Verifica se o status HTTP é 200 (OK)
  61  |   expect(response.status()).toBe(200);
  62  | 
  63  |   // Converte o corpo da resposta para JSON
  64  |   const body = await response.json();
  65  | 
  66  |   // Verifica se o email retornado é o mesmo que enviamos
  67  |   expect(body.email).toBe(emailUnico);
  68  | 
  69  |   // Verifica se o usuário foi criado com um id numérico
  70  |   expect(body.id).toBeTruthy();
  71  | });
  72  | 
  73  | // =============================================================================
  74  | // TESTE DE API 2 — POST /auth/signup com e-mail duplicado (BUG capturado)
  75  | // =============================================================================
  76  | 
  77  | test("API - POST /auth/signup com e-mail duplicado deve retornar mensagem 'E-mail já cadastrado' [BUG]", async ({ request }) => {
  78  |   /**
  79  |    * O que este teste valida:
  80  |    * Ao tentar cadastrar um email já existente, a API deve retornar:
  81  |    * - Status HTTP 409 (Conflict)
  82  |    * - Mensagem de erro: "E-mail já cadastrado"
  83  |    *
  84  |    * BUG CAPTURADO:
  85  |    * O requisito exige a mensagem "E-mail já cadastrado",
  86  |    * mas a API retorna "E-mail já está em uso".
  87  |    * Este teste FALHA propositalmente, provando o bug.
  88  |    *
  89  |    * Requisito: "O sistema deve exibir a mensagem de erro 'E-mail já cadastrado'
  90  |    *             caso o e-mail informado já exista na base de dados."
  91  |    */
  92  | 
  93  |   const emailDuplicado = `duplicado_${Date.now()}@email.com`;
  94  | 
  95  |   // Primeiro cadastro — deve funcionar normalmente
  96  |   await request.post(`${API_URL}/auth/signup`, {
  97  |     data: {
  98  |       email: emailDuplicado,
  99  |       password: "Senha@1234",
  100 |     },
  101 |   });
  102 | 
  103 |   // Segundo cadastro com o mesmo email — deve retornar erro 409
  104 |   const response = await request.post(`${API_URL}/auth/signup`, {
  105 |     data: {
  106 |       email: emailDuplicado,
  107 |       password: "Senha@1234",
  108 |     },
  109 |   });
  110 | 
  111 |   // Verifica se o status é 409 (Conflict)
  112 |   expect(response.status()).toBe(409);
  113 | 
  114 |   const body = await response.json();
  115 | 
  116 |   // FALHA ESPERADA: a API retorna "E-mail já está em uso" em vez de "E-mail já cadastrado"
> 117 |   expect(body.message).toBe("E-mail já cadastrado");
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  118 | });
  119 | 
  120 | // =============================================================================
  121 | // TESTE DE API 3 — POST /auth/signin com credenciais corretas
  122 | // =============================================================================
  123 | 
  124 | test("API - POST /auth/signin com credenciais válidas deve retornar 200 e dados do usuário", async ({ request }) => {
  125 |   /**
  126 |    * O que este teste valida:
  127 |    * Ao fazer login com email e senha corretos, a API deve:
  128 |    * - Retornar status HTTP 200
  129 |    * - Retornar os dados do usuário autenticado
  130 |    *
  131 |    * Requisito: "O sistema deve permitir que usuários façam login
  132 |    *             com e-mail e senha corretos."
  133 |    */
  134 | 
  135 |   const email = `signin_${Date.now()}@email.com`;
  136 |   const senha = "Senha@1234";
  137 | 
  138 |   // Primeiro cadastra o usuário
  139 |   await request.post(`${API_URL}/auth/signup`, {
  140 |     data: { email, password: senha },
  141 |   });
  142 | 
  143 |   // Depois tenta fazer login com as mesmas credenciais
  144 |   const response = await request.post(`${API_URL}/auth/signin`, {
  145 |     data: { email, password: senha },
  146 |   });
  147 | 
  148 |   // Verifica status 200
  149 |   expect(response.status()).toBe(200);
  150 | 
  151 |   const body = await response.json();
  152 | 
  153 |   // Verifica se retornou os dados corretos do usuário
  154 |   expect(body.email).toBe(email);
  155 |   expect(body.id).toBeTruthy();
  156 | });
  157 | 
  158 | // =============================================================================
  159 | // TESTE DE API 4 — POST /auth/signin com credenciais incorretas
  160 | // =============================================================================
  161 | 
  162 | test("API - POST /auth/signin com credenciais inválidas deve retornar 401 e 'Credenciais inválidas'", async ({ request }) => {
  163 |   /**
  164 |    * O que este teste valida:
  165 |    * Ao fazer login com senha errada, a API deve:
  166 |    * - Retornar status HTTP 401 (Unauthorized)
  167 |    * - Retornar a mensagem "Credenciais inválidas"
  168 |    *
  169 |    * Requisito: "Caso as credenciais estejam incorretas, a mensagem de erro
  170 |    *             'Credenciais inválidas' deve ser exibida."
  171 |    */
  172 | 
  173 |   // Tenta login com email que não existe
  174 |   const response = await request.post(`${API_URL}/auth/signin`, {
  175 |     data: {
  176 |       email: "naoexiste@email.com",
  177 |       password: "Senha@1234",
  178 |     },
  179 |   });
  180 | 
  181 |   // Verifica status 401 (não autorizado)
  182 |   expect(response.status()).toBe(401);
  183 | 
  184 |   const body = await response.json();
  185 | 
  186 |   // Verifica se a mensagem é exatamente a do requisito
  187 |   expect(body.message).toBe("Credenciais inválidas");
  188 | });
  189 | 
  190 | // =============================================================================
  191 | // TESTE DE API 5 — POST /auth/reset-password com email não cadastrado
  192 | // =============================================================================
  193 | 
  194 | test("API - POST /auth/reset-password com email inexistente deve retornar 404 e 'Usuário não encontrado'", async ({ request }) => {
  195 |   /**
  196 |    * O que este teste valida:
  197 |    * Ao solicitar redefinição de senha com email não cadastrado, a API deve:
  198 |    * - Retornar status HTTP 404 (Not Found)
  199 |    * - Retornar a mensagem "Usuário não encontrado"
  200 |    *
  201 |    * Requisito: "Caso o e-mail informado não esteja cadastrado, o sistema deve
  202 |    *             exibir a mensagem de erro 'Usuário não encontrado'."
  203 |    */
  204 | 
  205 |   const response = await request.post(`${API_URL}/auth/reset-password`, {
  206 |     data: {
  207 |       email: "inexistente@email.com",
  208 |     },
  209 |   });
  210 | 
  211 |   // Verifica status 404
  212 |   expect(response.status()).toBe(404);
  213 | 
  214 |   const body = await response.json();
  215 | 
  216 |   // Verifica a mensagem de erro
  217 |   expect(body.message).toBe("Usuário não encontrado");
```