package com.demoapp.demo;

import com.demoapp.demo.dto.UserDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // =====================================================================
    // TESTES DE SUCESSO
    // =====================================================================

    @Test
    @DisplayName("[SUCESSO] POST /auth/signup deve retornar 200 e criar usuário com dados válidos")
    void testSignup_sucesso() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setEmail("novo@email.com");
        dto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("novo@email.com"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/signin deve retornar 401 para credenciais inválidas")
    void testSignin_credenciaisInvalidas() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setEmail("naoexiste@email.com");
        dto.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciais inválidas"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/signup deve retornar 422 para senha inválida")
    void testSignup_senhaInvalida() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setEmail("teste@email.com");
        dto.setPassword("senhafraca");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Senha inválida"));
    }

    @Test
    @DisplayName("[SUCESSO] POST /auth/signin deve retornar 200 e dados do usuário para login correto")
    void testSignin_sucesso() throws Exception {
        // Primeiro cadastra
        UserDTO cadastro = new UserDTO();
        cadastro.setEmail("login@email.com");
        cadastro.setPassword("Senha@123");
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cadastro)))
                .andExpect(status().isOk());

        // Depois faz login
        UserDTO login = new UserDTO();
        login.setEmail("login@email.com");
        login.setPassword("Senha@123");

        mockMvc.perform(post("/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("login@email.com"));
    }

    // =====================================================================
    // TESTE DE BUG — Este teste FALHA, provando a existência do bug
    // =====================================================================

    @Test
    @DisplayName("[BUG] POST /auth/signup com e-mail duplicado deve retornar 'E-mail já cadastrado' — FALHA ESPERADA")
    void testSignup_BUG_emailDuplicado_mensagemErrada() throws Exception {

        // Cadastra o primeiro usuário
        UserDTO dto = new UserDTO();
        dto.setEmail("duplicado@email.com");
        dto.setPassword("Senha@123");
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        // Tenta cadastrar novamente com o mesmo e-mail
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("E-mail já cadastrado"));
        // ^ Este assert vai FALHAR porque a API retorna "E-mail já está em uso"
    }
}
