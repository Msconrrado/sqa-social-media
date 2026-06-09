package com.demoapp.demo;

import com.demoapp.demo.service.UserService;
import com.demoapp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

public class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        UserRepository mockRepo = Mockito.mock(UserRepository.class);
        userService = new UserService(mockRepo);
    }

    // =====================================================================
    // TESTES DE SUCESSO (comportamentos corretos)
    // =====================================================================

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve retornar true para senha forte válida")
    void testPasswordValid_senhaForte() {
        // Senha com maiúscula, minúscula, número e caractere especial, 8+ chars
        assertTrue(userService.isPasswordValid("Senha@123"));
    }

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve retornar false para senha sem caractere especial")
    void testPasswordValid_semEspecial() {
        assertFalse(userService.isPasswordValid("Senha1234"));
    }

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve retornar false para senha sem maiúscula")
    void testPasswordValid_semMaiuscula() {
        assertFalse(userService.isPasswordValid("senha@123"));
    }

    @Test
    @DisplayName("[SUCESSO] isPasswordValid deve retornar false para senha muito curta")
    void testPasswordValid_muitoCurta() {
        assertFalse(userService.isPasswordValid("Ab@1"));
    }

    @Test
    @DisplayName("[SUCESSO] isEmailValid deve retornar true para email válido")
    void testEmailValid_emailValido() {
        assertTrue(userService.isEmailValid("usuario@email.com"));
    }

    @Test
    @DisplayName("[SUCESSO] isEmailValid deve retornar false para email nulo")
    void testEmailValid_emailNulo() {
        assertFalse(userService.isEmailValid(null));
    }

    // =====================================================================
    // TESTE DE BUG — Este teste FALHA, provando a existência do bug
    // =====================================================================

    @Test
    @DisplayName("[BUG] isEmailValid deve retornar false para 'invalido@' (sem domínio) — FALHA ESPERADA")
    void testEmailValid_BUG_semDominio() {
        assertFalse(
            userService.isEmailValid("invalido@"),
            "Email 'invalido@' não tem domínio e deveria ser inválido, mas isEmailValid() retorna true."
        );
    }

    @Test
    @DisplayName("[BUG] isEmailValid deve retornar false para '@semlocal.com' (sem parte local) — FALHA ESPERADA")
    void testEmailValid_BUG_semParteLocal() {
        /*
         * BUG: mesmo problema — "@semlocal.com" contém '@' e passa como válido.
         */
        assertFalse(
            userService.isEmailValid("@semlocal.com"),
            "Email '@semlocal.com' não tem parte local e deveria ser inválido, mas isEmailValid() retorna true."
        );
    }
}
