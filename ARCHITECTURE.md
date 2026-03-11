# 🦇 Wayne Industries — Documentação de Arquitetura Técnica

Este documento serve como guia para desenvolvedores e engenheiros de software que farão a manutenção ou expansão do Sistema de Gerenciamento de Segurança da Wayne Industries.

## 1. Visão Geral
O sistema adota uma arquitetura de API RESTful provida por um backend modular em Flask, consumida por um frontend "Single-Page Application" simulado construído em Vanilla JavaScript.

## 2. Autenticação e Segurança (Sessões)
Diferente de sistemas modernos baseados em tokens JWT, esta aplicação utiliza o sistema nativo de **Sessões do Flask**.
* Os cookies de sessão são configurados com `SESSION_COOKIE_HTTPONLY = True` e `SESSION_COOKIE_SAMESITE = "Lax"` nativamente, mitigando riscos de ataques XSS e a maior parte das falsificações de requisições (CSRF).
* O hash e a verificação de senhas são feitos utilizando as funções nativas da biblioteca `werkzeug.security` (`generate_password_hash` e `check_password_hash`), não armazenando senhas em texto plano no banco.
* No frontend, a autenticação é checada na inicialização das páginas seguras através da rota `/api/auth/me`, que por sua vez popula a variável global de estado `currentUser`.

## 3. Backend: Flask, Blueprints e Middlewares
Para manter a escalabilidade do código, as rotas não estão concentradas no arquivo principal (`app.py`).
* **Blueprints:** O roteamento é modular. As rotas estão divididas em instâncias lógicas de Blueprints dentro da pasta `routes/` (ex: `auth_bp`, `resources_bp`, `dashboard_bp`, `users_bp` e `activity_bp`).
* **Middlewares de Controle de Acesso:** O arquivo `middleware.py` define decoradores essenciais para a segurança dos endpoints:
  * `@login_required`: Inspeciona se existe um `user_id` válido na sessão atual. Retorna um erro JSON 401 caso não exista.
  * `@role_required(*required_roles)`: Além de verificar a autenticação, checa no banco de dados se o usuário possui algum dos papéis informados (ex: `manager` ou `security_admin`). Se a checagem falhar, interrompe a requisição com um erro 403 (Permissões insuficientes).

## 4. Banco de Dados e ORM (MySQL + SQLAlchemy)
O armazenamento relacional no MySQL é gerenciado através do mapeamento objeto-relacional (ORM) do SQLAlchemy.
* **Chaves Primárias (UUID):** Por padrão, todas as entidades ganham IDs através de UUIDs de 36 caracteres. Isso é feito automaticamente na inserção através da função `uuid.uuid4()` no Python ou `UUID()` direto na base do MySQL.
* **Entidades e Relacionamentos:**
  * `users`: Tabela principal de identidade, armazenando o hash da senha, e-mail e nome.
  * `user_roles`: Gerencia os papéis em relacionamento 1:N com `users` (`employee`, `manager`, `security_admin`). Foi configurada uma exclusão em cascata profunda no modelo SQLAlchemy (`cascade="all, delete-orphan"`).
  * `resources`: Mapeia equipamentos, veículos e dispositivos. A chave estrangeira `created_by` referencia `users(id)` com a diretiva `ON DELETE SET NULL`, garantindo que o recurso não seja apagado acidentalmente se o usuário que o registrou for desligado.
  * `activity_logs`: Registro de ações da plataforma para fins de auditoria.

## 5. Frontend: Vanilla JS e Padrões de Código
A interface foi escrita completamente sem frameworks de terceiros para priorizar desempenho e simplicidade.
* **Comunicação com a API (`fetch` wrapper):** O arquivo `common.js` centraliza o consumo HTTP na função assíncrona `api(path, opts)`. Ela configura os cabeçalhos básicos (`Content-Type: application/json`), habilita envio de cookies na requisição (`credentials: "same-origin"`) e intercepta erros para disparar balões de notificação (*Toasts*) padronizados no sistema.
* **Manipulação Limpa de DOM:** Para evitar sintaxes verbosas, utiliza-se a função utilitária `$` (wrapper para `querySelector`) e `$$` (para `querySelectorAll`).
* **Prevenção de XSS na Interface:** Uma função auxiliar chamada `esc(s)` escapa qualquer string recebida do banco criando um Node de texto na memória e extraindo o `innerHTML`, sendo aplicada sistematicamente nas tabelas de dados do sistema.
* **Controle de Acesso Dinâmico:** A barra de navegação principal é montada via JavaScript utilizando `buildNav(activeId)`. A função verifica o `currentUser.role` omitindo módulos críticos da UI se o papel não conferir. Padrão semelhante ocorre na construção das tabelas, limitando os botões de ação utilizando a função booleana `isManagerOrAdmin()`.