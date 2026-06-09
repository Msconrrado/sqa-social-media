/**
 * ARQUIVO: utils.test.ts
 * TIPO: Testes Unitários de Funções Puras (Jest puro, sem renderização)
 *
 * O que são testes de funções puras?
 * São testes que verificam funções que recebem uma entrada e retornam uma saída,
 * sem depender de componentes visuais, banco de dados ou API.
 *
 * Arquivos testados:
 * - utils/password.ts → funções de validação de senha
 * - utils/email.ts    → funções de validação de email
 *
 * BUG ENCONTRADO (capturado pelo teste marcado com [BUG]):
 * isPasswordValid() usa `password.length <= 8` em vez de `< 8`.
 * Isso faz com que senhas com EXATAMENTE 8 caracteres sejam rejeitadas,
 * contrariando o requisito que diz "mínimo 8 caracteres".
 */
 
// Importa as funções de validação de senha que serão testadas
import { isPasswordValid, getPasswordValidationMessage } from "@/utils/password";
 
// Importa as funções de validação de email que serão testadas
import { isEmailValid, getEmailValidationMessage } from "@/utils/email";
 
// =============================================================================
// TESTES DE: isPasswordValid e getPasswordValidationMessage (utils/password.ts)
// =============================================================================
 
// describe() agrupa testes relacionados — aqui agrupamos os testes de isPasswordValid
describe("isPasswordValid", () => {
 
  // Testa o caso feliz: senha com todos os critérios atendidos
  test("[SUCESSO] retorna true para senha forte com mais de 8 chars", () => {
    // "Senha@1234" tem maiúscula, minúscula, número, especial e mais de 8 chars
    expect(isPasswordValid("Senha@1234")).toBe(true); // espera que retorne true
  });
 
  // Testa se a função rejeita senha sem letra maiúscula
  test("[SUCESSO] retorna false para senha sem letra maiúscula", () => {
    expect(isPasswordValid("senha@1234")).toBe(false); // tudo minúsculo → inválida
  });
 
  // Testa se a função rejeita senha sem letra minúscula
  test("[SUCESSO] retorna false para senha sem letra minúscula", () => {
    expect(isPasswordValid("SENHA@1234")).toBe(false); // tudo maiúsculo → inválida
  });
 
  // Testa se a função rejeita senha sem número
  test("[SUCESSO] retorna false para senha sem número", () => {
    expect(isPasswordValid("Senha@abcd")).toBe(false); // sem dígito → inválida
  });
 
  // Testa se a função rejeita senha sem caractere especial (@, #, !, etc.)
  test("[SUCESSO] retorna false para senha sem caractere especial", () => {
    expect(isPasswordValid("Senha12345")).toBe(false); // sem especial → inválida
  });
 
  // Testa o caso extremo: senha vazia
  test("[SUCESSO] retorna false para senha vazia", () => {
    expect(isPasswordValid("")).toBe(false); // string vazia → inválida
  });
 
  // -------------------------------------------------------------------------
  // TESTE DE BUG — Este teste FALHA propositalmente, provando o bug
  // -------------------------------------------------------------------------
  test("[BUG] retorna true para senha com EXATAMENTE 8 chars válidos — FALHA ESPERADA", () => {
    /**
     * COMO IDENTIFIQUEI ESSE BUG:
     * Ao tentar cadastrar com uma senha de exatamente 8 caracteres válidos,
     * o sistema rejeitava a senha como inválida.
     *
     * CAUSA DO BUG (em utils/password.ts):
     * O código usa:   if (!password || password.length <= 8)  → rejeita 8 chars
     * Deveria usar:   if (!password || password.length < 8)   → aceita 8 chars
     *
     * REQUISITO: "mínimo 8 caracteres" → senha com 8 chars DEVE ser válida
     *
     * "Ab@1cdef" tem exatamente 8 chars, maiúscula, minúscula, número e especial.
     * Deveria retornar true, mas retorna false por causa do bug acima.
     */
    expect(isPasswordValid("Ab@1cdef")).toBe(true); // FALHA: o código retorna false
  });
});
 
// Agrupa testes da função que retorna a mensagem de erro da senha
describe("getPasswordValidationMessage", () => {
 
  // Quando a senha é válida, a mensagem deve ser string vazia (sem erro)
  test("[SUCESSO] retorna string vazia para senha válida", () => {
    expect(getPasswordValidationMessage("Senha@1234")).toBe(""); // sem erro
  });
 
  // Quando a senha está vazia, retorna mensagem de obrigatoriedade
  test("[SUCESSO] retorna 'Senha é obrigatória' para senha vazia", () => {
    expect(getPasswordValidationMessage("")).toBe("Senha é obrigatória");
  });
 
  // Verifica se a mensagem menciona o critério de tamanho quando a senha é curta
  test("[SUCESSO] menciona 'mínimo de 8 caracteres' para senha curta", () => {
    // toContain() verifica se a string contém o trecho esperado
    expect(getPasswordValidationMessage("Ab@1")).toContain("mínimo de 8 caracteres");
  });
 
  // Verifica se a mensagem menciona ausência de maiúscula
  test("[SUCESSO] menciona 'uma letra maiúscula' quando ausente", () => {
    expect(getPasswordValidationMessage("senha@1234")).toContain("uma letra maiúscula");
  });
});
 
// =============================================================================
// TESTES DE: isEmailValid e getEmailValidationMessage (utils/email.ts)
// =============================================================================
 
describe("isEmailValid", () => {
 
  // Caso feliz: email no formato correto
  test("[SUCESSO] retorna true para email válido", () => {
    expect(isEmailValid("usuario@dominio.com")).toBe(true);
  });
 
  // Email vazio deve ser inválido
  test("[SUCESSO] retorna false para string vazia", () => {
    expect(isEmailValid("")).toBe(false);
  });
 
  // Email sem @ não é um email válido
  test("[SUCESSO] retorna false para email sem @", () => {
    expect(isEmailValid("emailsemarroba.com")).toBe(false);
  });
 
  // Email sem domínio após o @ não é válido
  test("[SUCESSO] retorna false para email sem domínio", () => {
    expect(isEmailValid("usuario@")).toBe(false);
  });
});
 
describe("getEmailValidationMessage", () => {
 
  // Email válido → sem mensagem de erro
  test("[SUCESSO] retorna string vazia para email válido", () => {
    expect(getEmailValidationMessage("user@email.com")).toBe("");
  });
 
  // Campo vazio → mensagem de obrigatoriedade
  test("[SUCESSO] retorna 'Email é obrigatório' para string vazia", () => {
    expect(getEmailValidationMessage("")).toBe("Email é obrigatório");
  });
 
  // Formato inválido → mensagem de email inválido
  test("[SUCESSO] retorna 'Email inválido' para formato inválido", () => {
    expect(getEmailValidationMessage("naoeemail")).toBe("Email inválido");
  });
});