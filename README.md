# Audit Premium

Sistema acadêmico para apoio a auditorias de Segurança da Informação, com foco nas normas **ISO/IEC 27002** e **ISO/IEC 27701**.

A aplicação permite:

* Cadastro e gerenciamento de empresas;
* Criação e acompanhamento de auditorias;
* Resposta de controles de conformidade;
* Anexação de evidências;
* Dashboards de acompanhamento;
* Geração de relatórios;
* Administração de usuários e códigos de acesso.

---

# Tutorial de Instalação

Este tutorial descreve o processo completo de implantação da aplicação **Audit Premium** em uma instância **Amazon EC2 (Amazon Linux 2023)** utilizando Docker e Docker Compose.
Acessar vídeos: https://drive.google.com/drive/folders/1dbJcM725XClHxH2SrHnKk2RYeESlfw0z?usp=sharing

---

## 1. Preparação da Instância EC2

Após criar e acessar a instância EC2, execute os comandos abaixo.

### Atualizar os pacotes do sistema

```bash
sudo yum update -y
```

### Instalar o Git

```bash
sudo yum install git -y
```

### Instalar o Docker

```bash
sudo dnf install docker -y
```

### Iniciar o serviço Docker

```bash
sudo systemctl start docker
```

### Habilitar inicialização automática do Docker

```bash
sudo systemctl enable docker
```

### Adicionar o usuário ao grupo Docker

```bash
sudo usermod -aG docker ec2-user
```

### Encerrar a sessão

```bash
exit
```

Conecte-se novamente à instância para que as permissões sejam aplicadas.

---

## 2. Verificar Instalação do Docker

### Verificar versão instalada

```bash
docker --version
```

Exemplo:

```bash
Docker version 28.x.x
```

---

## 3. Instalação do Docker Compose

### Baixar o executável

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
```

### Conceder permissão de execução

```bash
sudo chmod +x /usr/local/bin/docker-compose
```

### Verificar instalação

```bash
docker-compose --version
```

---

# 4. Clonando o Projeto

### Clonar o repositório

```bash
git clone https://github.com/mariaacaetano/AuditApp.git
```

### Acessar o diretório

```bash
cd AuditApp
```

### Verificar arquivos baixados

```bash
ls -la
```

---

# 5. Configuração do Endereço IP

Abra o arquivo:

```bash
vi docker-compose.yml
```

Localize as variáveis:

```yaml
ALLOWED_HOSTS:
CORS_ALLOWED_ORIGINS:
```

Substitua o IP abaixo pelo IP público da sua instância EC2.

```yaml
ALLOWED_HOSTS: "localhost,127.0.0.1,backend,auditapp.lsx.li,SEU_IP_PUBLICO"

CORS_ALLOWED_ORIGINS: "http://localhost,http://127.0.0.1,http://localhost:5173,http://127.0.0.1:5173,https://auditapp.lsx.li,http://SEU_IP_PUBLICO"
```

Exemplo:

```yaml
ALLOWED_HOSTS: "localhost,127.0.0.1,backend,auditapp.lsx.li,54.234.151.6"

CORS_ALLOWED_ORIGINS: "http://localhost,http://127.0.0.1,http://localhost:5173,http://127.0.0.1:5173,https://auditapp.lsx.li,http://54.234.151.6"
```

---

# 6. Inicialização da Aplicação

### Construir e iniciar os containers

```bash
docker-compose up -d --build
```

### Verificar containers ativos

```bash
docker ps
```

Resultado esperado:

```bash
audit_frontend
audit_backend
audit_db
```

---

# 7. Criação do Usuário Administrador

Criar o superusuário do Django:

```bash
docker exec -it audit_backend python manage.py createsuperuser
```

Exemplo:

```text
Username: admin
Email: admin@auditapp.com
Password: ********
```

---

# 8. Teste da API

### Teste local do backend

```bash
curl -i -X POST http://localhost:8000/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```

Resultado esperado:

```bash
HTTP/1.1 200 OK
```

---

### Teste público via Nginx

Substitua pelo IP da sua instância:

```bash
curl -i -X POST http://SEU_IP_PUBLICO/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```

Exemplo:

```bash
curl -i -X POST http://54.234.151.6/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```

Resultado esperado:

```bash
HTTP/1.1 200 OK
```

---

# 9. Acesso à Aplicação

Abra um navegador e acesse:

```text
http://SEU_IP_PUBLICO
```

Exemplo:

```text
http://54.234.151.6
```

---

# 10. Verificação do Proxy Nginx

Caso haja problemas de comunicação entre frontend e backend:

```bash
docker exec audit_frontend cat /etc/nginx/conf.d/default.conf
```

Esse arquivo define as regras de proxy reverso utilizadas pelo frontend.

---

# 11. Banco de Dados

## Instalar dependências

```bash
sudo yum update -y
```

```bash
sudo yum install -y gcc python3-devel pkgconfig openssl-devel mariadb-connector-c mariadb-connector-c-devel
```

---

## Aplicar Migrações

Se o backend estiver em execução:

```bash
docker-compose exec backend python manage.py migrate
```

---

## Inserir Dados Iniciais

```bash
docker-compose exec backend python controles/inserir_base/inserir_base.py
```

---

# 12. Comandos Úteis

### Reiniciar aplicação

```bash
docker-compose down
docker-compose up -d --build
```

### Ver logs do backend

```bash
docker logs audit_backend --tail=100
```

### Ver logs do frontend

```bash
docker logs audit_frontend --tail=100
```

### Ver containers em execução

```bash
docker ps
```
