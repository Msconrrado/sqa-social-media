import React from "react";

// Ferramentas do Testing Library para renderizar e interagir com componentes
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// waitFor() é usado para esperar que operações assíncronas (como chamadas de API) terminem
import "@testing-library/jest-dom";

// Cria função falsa para o router.push() do Next.js
const mockPush = jest.fn();

// Substitui o módulo de navegação do Next.js por versão controlável nos testes
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Substitui o contexto de autenticação por versão falsa e controlável
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Substitui o serviço de autenticação por funções falsas
// Isso evita chamadas reais à API durante os testes
jest.mock("@/service/auth/auth", () => ({
  authService: {
    signIn: jest.fn(),       // função falsa para login
    signUp: jest.fn(),       // função falsa para cadastro
    resetPassword: jest.fn(), // função falsa para reset de senha
  },
}));

// Importa os mocks para configurá-los dentro de cada teste
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/service/auth/auth";

// Importa as páginas que serão testadas
import SignIn from "@/app/signin/page";
import SignUp from "@/app/signup/page";
import ResetPassword from "@/app/reset-password/page";

// Importa as funções do localStorage para o teste de bug
import { saveUser, getUser } from "@/lib/localStorage";

function getFormButton(name: RegExp) {
  const buttons = screen.getAllByRole("button", { name }); // pega todos os botões com esse nome
  return buttons[buttons.length - 1]; // retorna o último (que é o do formulário)
}

// =============================================================================
// TESTES DA TELA DE LOGIN: SignIn
// =============================================================================

describe("Tela de Login - SignIn (integração)", () => {

  // Executado antes de cada teste — garante estado limpo
  beforeEach(() => {
    jest.clearAllMocks(); // limpa registros de chamadas anteriores

    // Configura o contexto de auth como usuário deslogado por padrão
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: jest.fn(),
      login: jest.fn(),
    });
  });

  // Verifica se os campos da tela de login estão sendo renderizados
  test("[SUCESSO] renderiza campo de email e senha", () => {
    render(<SignIn />); // renderiza a página completa de login

    // getByPlaceholderText() busca um input pelo seu placeholder
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  // Requisito: campo de email vazio deve exibir mensagem de erro
  test("[SUCESSO] exibe erro quando email está vazio ao submeter", async () => {
    render(<SignIn />);

    // Clica no botão Entrar sem preencher nenhum campo
    fireEvent.click(getFormButton(/entrar/i));

    // waitFor() aguarda a mensagem de erro aparecer (pode ser assíncrono)
    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
    });
  });

  // Requisito: campo de senha vazio deve exibir mensagem de erro
  test("[SUCESSO] exibe erro quando senha está vazia ao submeter", async () => {
    render(<SignIn />);

    // Preenche apenas o email e tenta submeter
    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "user@email.com" }, // simula o usuário digitando
    });
    fireEvent.click(getFormButton(/entrar/i));

    await waitFor(() => {
      expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
    });
  });

  // Requisito: login bem-sucedido deve autenticar e redirecionar para "/"
  test("[SUCESSO] login bem-sucedido chama login() e redireciona para '/'", async () => {
    const mockLogin = jest.fn(); // cria função falsa para registrar se login() foi chamado

    // Reconfigura o mock com a função de login que podemos verificar
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: jest.fn(),
      login: mockLogin,
    });

    // Simula a API retornando sucesso com dados do usuário
    (authService.signIn as jest.Mock).mockResolvedValue({ id: 1, email: "user@email.com" });

    render(<SignIn />);

    // Simula o usuário preenchendo o formulário
    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "user@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Senha@123" },
    });
    fireEvent.click(getFormButton(/entrar/i));

    await waitFor(() => {
      // Verifica se a função login() foi chamada com os dados do usuário
      expect(mockLogin).toHaveBeenCalledWith({ id: 1, email: "user@email.com" });
      // Verifica se o redirecionamento para "/" aconteceu
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  // Requisito: credenciais erradas devem exibir "Credenciais inválidas"
  test("[SUCESSO] exibe mensagem 'Credenciais inválidas' vinda da API", async () => {
    // Simula um erro HTTP 401 (não autorizado) da API
    const { AxiosError } = jest.requireActual("axios");
    const err = new AxiosError("", "401", undefined, undefined, {
      data: { message: "Credenciais inválidas" }, // mensagem que a API retorna
      status: 401,
    } as any);

    // Configura o mock para rejeitar (simular erro) quando signIn for chamado
    (authService.signIn as jest.Mock).mockRejectedValue(err);

    render(<SignIn />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "user@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Senha@123" },
    });
    fireEvent.click(getFormButton(/entrar/i));

    await waitFor(() => {
      // Verifica se a mensagem de erro da API aparece na tela
      expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TESTES DA TELA DE CADASTRO: SignUp
// =============================================================================

describe("Tela de Cadastro - SignUp (integração)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear(); // limpa o localStorage entre os testes

    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: jest.fn(),
      login: jest.fn(),
    });
  });

  // Verifica se todos os campos do cadastro estão presentes
  test("[SUCESSO] renderiza campos email, senha e confirmar senha", () => {
    render(<SignUp />);

    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();

    // getAllByPlaceholderText() retorna todos os elementos com esse placeholder
    // Tanto "Senha" quanto "Confirmar Senha" usam "••••••••", então devem ser 2
    expect(screen.getAllByPlaceholderText("••••••••")).toHaveLength(2);
  });

  // Requisito: senhas diferentes devem exibir mensagem de erro
  test("[SUCESSO] exibe erro quando senhas não coincidem", async () => {
    render(<SignUp />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "user@email.com" },
    });

    // Desestrutura o array para pegar os dois campos de senha separadamente
    const [senha, confirmar] = screen.getAllByPlaceholderText("••••••••");

    fireEvent.change(senha, { target: { value: "Senha@1234" } });    // primeira senha
    fireEvent.change(confirmar, { target: { value: "Outra@1234" } }); // senha diferente

    fireEvent.click(getFormButton(/criar conta/i));

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    });
  });

  // Requisito: cadastro bem-sucedido deve autenticar e redirecionar para "/"
  test("[SUCESSO] cadastro bem-sucedido chama login() e redireciona para '/'", async () => {
    const mockLogin = jest.fn();

    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: jest.fn(),
      login: mockLogin,
    });

    // Simula a API retornando sucesso no cadastro
    (authService.signUp as jest.Mock).mockResolvedValue({ id: 42, email: "novo@email.com" });

    render(<SignUp />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "novo@email.com" },
    });

    const [senha, confirmar] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(senha, { target: { value: "Senha@1234" } });
    fireEvent.change(confirmar, { target: { value: "Senha@1234" } }); // senhas iguais

    fireEvent.click(getFormButton(/criar conta/i));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ id: 42, email: "novo@email.com" });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  // ---------------------------------------------------------------------------
  // TESTE DE BUG 1 — Falha propositalmente para provar o bug do localStorage
  // ---------------------------------------------------------------------------
  test("[BUG] getUser() deve recuperar o usuário salvo por saveUser() — FALHA ESPERADA", () => {
    /**
     * COMO IDENTIFIQUEI ESSE BUG:
     * Após fazer login ou cadastro, ao recarregar a página o usuário estava deslogado.
     * Investigando o código, encontramos a inconsistência nas chaves do localStorage.
     *
     * CAUSA DO BUG (em lib/localStorage.ts):
     *   saveUser() → localStorage.setItem("user", ...)         ← grava com "user"
     *   getUser()  → localStorage.getItem("sqa_social_user")   ← lê com "sqa_social_user"
     *
     * Como as chaves são diferentes, getUser() nunca encontra o que saveUser() gravou,
     * retornando null sempre — fazendo o usuário parecer deslogado após recarregar.
     *
     * CORREÇÃO: trocar "user" por USER_KEY (= "sqa_social_user") no saveUser().
     */
    const usuario = { id: 1, email: "teste@email.com" };

    saveUser(usuario);          // grava com chave "user"
    const recuperado = getUser(); // tenta ler com chave "sqa_social_user" → retorna null

    // Esta linha FALHA: recuperado é null por causa do bug acima
    expect(recuperado).toEqual(usuario);
  });
});

// =============================================================================
// TESTES DA TELA DE RESET DE SENHA: ResetPassword
// =============================================================================

describe("Tela de Reset de Senha (integração)", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: jest.fn(),
      login: jest.fn(),
    });
  });

  // Requisito: email não cadastrado deve exibir "Usuário não encontrado"
  test("[SUCESSO] exibe erro 'Usuário não encontrado' quando email não está cadastrado", async () => {
    // Simula erro 404 da API (usuário não existe)
    const { AxiosError } = jest.requireActual("axios");
    const err = new AxiosError("", "404", undefined, undefined, {
      data: { message: "Usuário não encontrado" },
      status: 404,
    } as any);

    (authService.resetPassword as jest.Mock).mockRejectedValue(err);

    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "naoexiste@email.com" },
    });

    // getByRole("button") busca um botão pelo seu texto/nome acessível
    fireEvent.click(screen.getByRole("button", { name: /enviar email/i }));

    await waitFor(() => {
      expect(screen.getByText("Usuário não encontrado")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // TESTE DE BUG 2 — Falha propositalmente para provar o bug da mensagem
  // ---------------------------------------------------------------------------
  test("[BUG] mensagem de sucesso deve ser exatamente 'E-mail enviado com sucesso' — FALHA ESPERADA", async () => {
    /**
     * COMO IDENTIFIQUEI ESSE BUG:
     * Testando a tela de reset de senha com um email válido,
     * a mensagem exibida era diferente do que o requisito especifica.
     *
     * CAUSA DO BUG (em app/reset-password/page.tsx):
     *   Código atual:  "Email enviado com sucesso para alterar a senha! Redirecionando..."
     *   Requisito:     "E-mail enviado com sucesso"
     *
     * Além do texto diferente, o requisito pede um TOAST (notificação visual),
     * mas o código exibe uma div simples na página.
     *
     * CORREÇÃO: alterar a mensagem para "E-mail enviado com sucesso".
     */

    // Simula a API retornando sucesso
    (authService.resetPassword as jest.Mock).mockResolvedValue({});

    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "existe@email.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar email/i }));

    await waitFor(() => {
      // Esta linha FALHA: o código exibe texto diferente do requisito
      expect(screen.getByText("E-mail enviado com sucesso")).toBeInTheDocument();
    });
  });
});
