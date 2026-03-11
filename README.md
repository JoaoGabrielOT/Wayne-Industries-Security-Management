# 🦇 Wayne Industries — Sistema de Gerenciamento de Segurança

## Visão Geral do Projeto
O **Sistema de Gerenciamento de Segurança da Wayne Industries** é uma plataforma interna desenvolvida para administrar as operações táticas, logísticas e de segurança em Gotham City. O sistema oferece controle de acesso baseado em papéis (RBAC), gerenciamento de inventário de recursos (equipamentos, veículos e dispositivos de segurança), registro de atividades do sistema e um painel de visualização interativo.

## 🚀 Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3, JavaScript "Vanilla" (Sem frameworks, alta performance).
- **Backend:** Python 3.10+ com Flask.
- **Banco de Dados:** MySQL 8.0+ utilizando Flask-SQLAlchemy (ORM).
- **Autenticação:** Baseada em sessões do Flask com hash de senhas via `werkzeug`.
- **Gráficos:** Chart.js (via CDN).
- **Ícones:** Lucide Icons.

---

## 🛡️ Controle de Acesso e Papéis (RBAC)
O sistema possui três níveis de acesso hierárquicos, garantindo que operações críticas sejam feitas apenas por pessoal autorizado:

1. **Employee (Funcionário):** Nível de acesso básico. Pode visualizar o dashboard, consultar o inventário de equipamentos, veículos e dispositivos, mas não pode realizar alterações.
2. **Manager (Gerente):** Além das permissões de funcionário, pode criar, editar e gerenciar o status de todos os recursos. Também possui acesso à aba de Logs de Atividade para auditoria.
3. **Security Admin (Administrador de Segurança):** Acesso irrestrito a todo o sistema. Único papel autorizado a excluir recursos permanentemente e a acessar o painel de Gerenciamento de Usuários (podendo promover ou rebaixar os papéis de outros agentes).

---

## ⚙️ Instruções de Configuração e Instalação

Siga os passos abaixo para rodar o projeto localmente no seu ambiente de desenvolvimento.

### 1. Instalar o MySQL
Certifique-se de ter o MySQL instalado em sua máquina.

**macOS (via Homebrew):**
```bash
brew install mysql && brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt install mysql-server && sudo systemctl start mysql
```

### 2. Criar o Banco de Dados e Usuário
Acesse o prompt do MySQL:
```bash
mysql -u root -p
```
Em seguida, execute os comandos para criar o banco e conceder as permissões:
```sql
CREATE DATABASE wayne_industries CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wayne'@'localhost' IDENTIFIED BY 'gotham2026';
GRANT ALL PRIVILEGES ON wayne_industries.* TO 'wayne'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Executar o Schema do Banco
Com o banco criado, importe a estrutura de tabelas executando o arquivo `schema.sql`:
```bash
mysql -u wayne -pgotham2026 wayne_industries < schema.sql
```

### 4. Instalar Dependências do Python
É recomendado usar um ambiente virtual (venv) para isolar as dependências.
```bash
# Cria o ambiente virtual
python3 -m venv venv

# Ativa o ambiente (No Windows use: venv\Scripts\activate)
source venv/bin/activate

# Instala as bibliotecas necessárias
pip install -r requirements.txt
```

### 5. Configurar as Variáveis de Ambiente
Crie o arquivo de configuração copiando o modelo `.env.example`:
```bash
cp .env.example .env
```
Abra o arquivo `.env` e ajuste as credenciais do MySQL ou a chave secreta do Flask  caso tenha alterado algo no passo 2.

### 6. Popular o Banco (Seed Data)
Para testar o sistema, você pode popular o banco de dados com usuários, equipamentos, veículos e dispositivos iniciais:
```bash
python seed.py
```

### 7. Iniciar a Aplicação
Execute o servidor de desenvolvimento do Flask:
```bash
python app.py
```
Acesse a plataforma no seu navegador através do endereço: **http://localhost:5000**

---

## 🔑 Credenciais de Teste
Caso tenha executado o script `seed.py`, utilize as credenciais abaixo para testar os diferentes níveis de acesso:

| Papel (Role)     | Email               | Senha     |
|------------------|---------------------|-----------|
| Administrador    | admin@wayne.com     | wayne123  |
| Gerente          | manager@wayne.com   | wayne123  |
| Funcionário      | employee@wayne.com  | wayne123  |

