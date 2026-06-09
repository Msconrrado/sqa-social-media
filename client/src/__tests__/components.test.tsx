import React from "react";

// render: renderiza o componente | screen: acessa elementos | fireEvent: simula interações
import { render, screen, fireEvent } from "@testing-library/react";

// Adiciona matchers extras como toBeInTheDocument(), toHaveTextContent(), etc.
import "@testing-library/jest-dom";

// Cria uma função falsa para simular o router.push() do Next.js
// Precisamos disso porque os componentes usam useRouter() para navegar entre páginas
const mockPush = jest.fn(); // jest.fn() cria uma função que registra quantas vezes foi chamada

// Substitui o módulo real do Next.js por uma versão falsa que usa nosso mockPush
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }), // toda chamada a router.push() usará o mockPush
}));

// Substitui o AuthContext real por uma versão falsa que podemos controlar nos testes
// Isso permite simular usuário logado ou deslogado sem precisar fazer login de verdade
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(), // será configurado em cada teste individualmente
}));

// Importa o hook falso para configurá-lo em cada teste
import { useAuth } from "@/contexts/AuthContext";

// Importa os componentes que serão testados
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";

// =============================================================================
// TESTES DO COMPONENTE: Header
// =============================================================================

describe("Header", () => {

  // Antes de cada teste, limpa os registros das funções falsas
  // Evita que chamadas de um teste interfiram no próximo
  beforeEach(() => jest.clearAllMocks());

  // Verifica se o título da aplicação está sendo exibido
  test("[SUCESSO] exibe o título 'SQA Social Media'", () => {
    // Simula usuário deslogado (isAuthenticated: false)
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, logout: jest.fn() });

    render(<Header />); // renderiza o Header

    // getByText() busca um elemento que contenha exatamente esse texto
    // toBeInTheDocument() verifica se o elemento existe na tela
    expect(screen.getByText("SQA Social Media")).toBeInTheDocument();
  });

  // Requisito: usuário deslogado deve ver botões "Entrar" e "Criar Conta"
  test("[SUCESSO] exibe botões 'Entrar' e 'Criar Conta' para deslogado", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, logout: jest.fn() });

    render(<Header />);

    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByText("Criar Conta")).toBeInTheDocument();
  });

  // Requisito: usuário logado deve ver botões "Posts Curtidos" e "Sair"
  test("[SUCESSO] exibe botões 'Posts Curtidos' e 'Sair' para logado", () => {
    // Simula usuário logado (isAuthenticated: true)
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, logout: jest.fn() });

    render(<Header />);

    expect(screen.getByText("Posts Curtidos")).toBeInTheDocument();
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });

  // Requisito: clicar no título deve redirecionar para a página principal "/"
  test("[SUCESSO] clicar no título navega para '/'", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, logout: jest.fn() });

    render(<Header />);

    // fireEvent.click() simula um clique do usuário no elemento
    fireEvent.click(screen.getByText("SQA Social Media"));

    // Verifica se router.push() foi chamado com o caminho "/"
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  // Requisito: botão "Posts Curtidos" deve redirecionar para "/auth/liked"
  test("[SUCESSO] clicar em 'Posts Curtidos' navega para '/auth/liked'", () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, logout: jest.fn() });

    render(<Header />);

    fireEvent.click(screen.getByText("Posts Curtidos"));

    expect(mockPush).toHaveBeenCalledWith("/auth/liked");
  });
});

// =============================================================================
// TESTES DO COMPONENTE: PostCard
// =============================================================================

// Objeto falso que representa um post — simula o que viria da API
const mockPost = {
  id: 1,                              // identificador único do post
  title: "Post de Teste",             // título do post
  body: "Corpo do post de teste.",    // conteúdo do post
  liked: false,                       // indica se o usuário já curtiu
};

describe("PostCard", () => {

  beforeEach(() => {
    jest.clearAllMocks(); // limpa registros de chamadas anteriores

    // Substitui o alert() real do navegador por uma função falsa
    // Assim conseguimos verificar se o alert foi chamado sem abrir janela real
    window.alert = jest.fn();
  });

  // Verifica se o card exibe o título e o corpo do post corretamente
  test("[SUCESSO] exibe título e corpo do post", () => {
    // Renderiza o PostCard passando o post falso, usuário deslogado e função onLike vazia
    render(<PostCard post={mockPost} isAuthenticated={false} onLike={jest.fn()} />);

    expect(screen.getByText("Post de Teste")).toBeInTheDocument();
    expect(screen.getByText("Corpo do post de teste.")).toBeInTheDocument();
  });

  // Verifica se o botão exibe "Curtir" quando o post ainda não foi curtido
  test("[SUCESSO] exibe texto 'Curtir' quando post não está curtido", () => {
    render(<PostCard post={mockPost} isAuthenticated={false} onLike={jest.fn()} />);

    expect(screen.getByText("Curtir")).toBeInTheDocument();
  });

  // Verifica se o botão exibe "Curtido" quando o post já foi curtido
  test("[SUCESSO] exibe texto 'Curtido' quando post já está curtido", () => {
    // Passa o post com liked: true para simular que já foi curtido
    render(<PostCard post={{ ...mockPost, liked: true }} isAuthenticated={false} onLike={jest.fn()} />);

    expect(screen.getByText("Curtido")).toBeInTheDocument();
  });

  // Requisito: usuário deslogado ao clicar em Curtir deve ver um alert
  test("[SUCESSO] usuário deslogado ao clicar Curtir vê alert de autenticação", () => {
    render(<PostCard post={mockPost} isAuthenticated={false} onLike={jest.fn()} />);

    // Simula clique no botão "Curtir"
    fireEvent.click(screen.getByText("Curtir"));

    // Verifica se o alert foi chamado com a mensagem correta do requisito
    expect(window.alert).toHaveBeenCalledWith(
      "Você precisa estar autenticado para curtir posts!"
    );
  });

  // Requisito: usuário logado ao clicar em Curtir deve chamar a função onLike
  test("[SUCESSO] usuário logado ao clicar Curtir chama onLike com id do post", () => {
    // mockResolvedValue simula uma função assíncrona que retorna com sucesso
    const onLike = jest.fn().mockResolvedValue(undefined);

    render(<PostCard post={mockPost} isAuthenticated={true} onLike={onLike} />);

    fireEvent.click(screen.getByText("Curtir"));

    // Verifica se onLike foi chamada com o id correto do post (1)
    expect(onLike).toHaveBeenCalledWith(1);
  });
});