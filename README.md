# Audit Premium

Sistema acadêmico para apoio a auditorias de segurança da informação, com foco em normas ISO/IEC 27002 e ISO/IEC 27701. A aplicação permite cadastrar empresas, criar auditorias, responder controles, anexar evidências, acompanhar dashboards, gerar relatórios e administrar usuários/códigos de acesso.

## Tecnologias

- Frontend: React, Vite, CSS, lucide-react
- Backend: Django, Django REST Framework, Simple JWT
- Banco de dados: MySQL 8.0
- Infraestrutura: Docker, Docker Compose, Nginx, Gunicorn

## Estrutura

```text
AuditApp/
├── audit-premium/          # Frontend React/Vite
├── normas/                 # Backend Django
│   ├── controles/          # Normas, controles, empresas, auditorias, respostas e evidências
│   ├── users/              # Usuários, autenticação, códigos de acesso e logs
│   └── config/             # Configurações Django
├── docs/                   # Diagramas e documentação UML
└── docker-compose.yml      # Orquestração dos serviços
```

## Pré-requisitos

Para execução com Docker:

- Docker
- Docker Compose

Para execução local sem Docker:

- Python 3.12+
- Node.js 22+
- MySQL 8.0+
- Dependências de compilação do `mysqlclient` no sistema operacional

## Instalação com Docker

Na raiz do projeto:

```bash
docker compose up --build
```

Serviços publicados:

- Frontend: `http://localhost`
- Backend/API: `http://localhost:8000`
- MySQL: `localhost:3307`

O backend executa as migrations automaticamente ao iniciar:

```bash
python manage.py migrate
```

### Criar usuário administrador

Com os containers em execução:

```bash
docker compose exec backend python manage.py createsuperuser
```

Depois, acesse:

```text
http://localhost/login
```

## Execução local para desenvolvimento

### 1. Banco de dados

Você pode usar o MySQL do Docker:

```bash
docker compose up db
```

Ele ficará disponível em `localhost:3307`.

### 2. Backend Django

Em outro terminal:

```bash
cd normas
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Defina as variáveis de ambiente para conectar ao MySQL local exposto pelo Docker:

```bash
export DJANGO_SETTINGS_MODULE=config.settings
export DEBUG=True
export DB_NAME=audit_premium
export DB_USER=audit_user
export DB_PASSWORD=audit_secure_password_2026
export DB_HOST=127.0.0.1
export DB_PORT=3307
```

Execute as migrations e suba o servidor:

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend React

Em outro terminal:

```bash
cd audit-premium
npm install
npm run dev
```

O Vite normalmente abre em:

```text
http://localhost:5173
```

O arquivo `vite.config.js` já possui proxy para:

- `/api`
- `/controles`
- `/media`

## Comandos úteis

Backend:

```bash
cd normas
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend:

```bash
cd audit-premium
npm run dev
npm run build
npm run lint
```

Docker:

```bash
docker compose up --build
docker compose down
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## Rotas principais

Frontend:

- `/login`
- `/cadastro`
- `/home`
- `/empresas`
- `/auditorias`
- `/auditorias/:id_auditoria/responder`
- `/auditorias/:id_auditoria/dashboard`
- `/normas`
- `/usuarios`
- `/sobre`

Backend:

- `/api/auth/login/`
- `/api/auth/register/`
- `/api/auth/token/refresh/`
- `/api/admin/usuarios/`
- `/api/admin/codigos-acesso/`
- `/controles/normas/`
- `/controles/empresas/view`
- `/controles/auditorias/view`
- `/controles/auditorias/create/`
- `/controles/auditoria/<id>/27002/retomar/`
- `/controles/auditoria/<id>/27701/retomar/`

## Documentação e diagramas

A documentação UML fica em:

- `docs/diagrama-classes.md`
- `docs/diagramas-uml.md`
- `docs/diagramas-uml.html`

A página `/sobre` também exibe a seção **Documentação**, com diagramas do sistema.

## Observações

- O arquivo `docker-compose.yml` usa credenciais de desenvolvimento para o banco MySQL.
- Para produção, altere senhas, `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS`.
- O volume `mysql_data` mantém os dados do banco entre reinicializações dos containers.
