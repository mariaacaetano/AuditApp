# Apresentação do Projeto AWS

- **Atividade Proposta:** Hospedar uma página web em nuvem, utilizando a AWS;
- **Alunos:** Maria Fernanda Caetano e Pedro Henrique Moreira Montes
- **Disciplina:** Computação em Nuvem
- **Professor:** Marco Antonio Torres Rojas

# 1. Apresentação da Aplicação

Utilizamos o sistema Audit Premium, um sistema acadêmico desenvolvido pela mesma dupla neste semestre. O sistema tem o objetivo de oferecer apoio a auditorias de Segurança da Informação, com foco nas normas **ISO/IEC 27002** e **ISO/IEC 27701**.

A aplicação permite:

* Cadastro e gerenciamento de empresas;
* Criação e acompanhamento de auditorias;
* Resposta de controles de conformidade;
* Anexação de evidências;
* Dashboards de acompanhamento;
* Geração de relatórios;
* Administração de usuários e códigos de acesso.

Este tutorial descreve o processo completo de implantação da aplicação **Audit Premium** em uma instância **Amazon EC2 (Amazon Linux 2023)** utilizando Docker e Docker Compose. Além do tutorial presente neste documento, e possível acompanhar a instalação feita antes de produzi-lo através dos vídeos gravados durante o processo:

- Acessar vídeos: https://drive.google.com/drive/folders/1dbJcM725XClHxH2SrHnKk2RYeESlfw0z?usp=sharing

---
# 2. Tutorial EC2

Esta seção tem como finalidade mostrar, passo a passo, como iniciar a instância EC2 através do Learner Lab, ferramenta utilizada para acessar o ambiente da AWS, oferecido na disciplina de Computação em Nuvem para a qual o presente projeto se destina.

## 2.1 Abrir o Learner Lab

- Ao entrar na AWS Academy, abrir o Learner Lab em **Painel de Controle**;
- Acessar **Módulos** e procurar pelo módulo "Laboratório de aprendizagem da AWS Academy"
- Acessar **Iniciar os laboratórios de aprendizagem da AWS Academy";
- Aguardar o carregamento da página;
- Ao surgir o menu superior, procurar pelo botão **Start Lab**;
- Aguardar o botão **ASWS** ficar verde e clicar para abrir o ambiente AWS em uma nova guia.

## 2.2 Iniciar uma Instância EC2

- Procurar por "EC2" na barra de pesquisa do menu superior do ambiente AWS (No vídeo, ele aparece em "Visitado Recentemente', pois foi acessado algumas vezes antes de fazer o vídeo para entender como a plataforma funcionava. Mas no primeiro acesso, é necessário procurar na barra de pesquisa);
- Na nova paǵina, procurar pelo botão amarelo/laranja **Executar Instânica**;
- Ela levará à uma página para selecionar a ocnfiguração da instância. A configuração deve ser:
  - **Nome da Tag:** Servidor Audit Premium (ou o nome que for melhor no momento);
  - **Imagem da aplicação:** AMI do Amazaon Linux 2023 kernel-6.1;
  - **Arquitetura:** 64 bits;
  - **Tipo da Instância:** t3.micro (escolhida por ter custo menor e ser mais recente, o que seria relevante em um projeto real);
  - **Par de Chaves:** vockey (tipo rsa);
  - **Configuração de Rede -> Criar grupo de Segurança:** Permitir tráfego SSH e Permitir tráfego HTTP da INternet;
- Executar a instância.

## 2.3 Conectar uma instância EC2

- Ir até EC2 > Instância;
- Selecionar a instância criada para este projeto;
- Selecionar **Conectar**;
- Na nova página, selecionar **Conectar-se a um IP Público**;
- Manter nome do usuário "ec2-user" (ou trocar, caso seja relevante);
- Selecionar o botão laranja/amarelo **Conectar**;
  
---

## 3. Tutorial de Instalação das Dependências

Após criar e acessar a instância EC2 e conectá-la, como explicado nos tópicos anteriores, no terminal aberto na nova guia seguir os passo a seguir:

### 3.1 Atualizar os pacotes do sistema

```bash
sudo yum update -y
```

### 3.2 Instalar o Git

```bash
sudo yum install git -y
```

### 3.3 Instalar o Docker

```bash
sudo dnf install docker -y
```

### 3.4 Iniciar o serviço Docker

```bash
sudo systemctl start docker
```

### 3.5 Habilitar inicialização automática do Docker

```bash
sudo systemctl enable docker
```

### 3.6 Adicionar o usuário ao grupo Docker

```bash
sudo usermod -aG docker ec2-user
```

### 3.7 Encerrar a sessão

```bash
exit
```
Conecte-se novamente à instância para que as permissões sejam aplicadas.


### 3.8 Verificar versão instalada

```bash
docker --version
```

### 3.9 Baixar o executável

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
```

### 3.10 Conceder permissão de execução

```bash
sudo chmod +x /usr/local/bin/docker-compose
```

### 3.11 Verificar instalação

```bash
docker-compose --version
```

---

# 4. Clonando o Projeto

### 4.1 Clonar o repositório

```bash
git clone https://github.com/mariaacaetano/AuditApp.git
```

### 4.2 Acessar o diretório

```bash
cd AuditApp
```

### 4.3 Verificar arquivos baixados

```bash
ls -la
```

### 4.4 Atualizar o IP permitido (IP da Instância)
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

# 5. Inicialização da Aplicação

### 5.1 Construir e iniciar os containers

```bash
docker-compose up -d --build
```

### 5.2 Verificar containers ativos

```bash
docker ps
```

### 5.3 Criar o superusuário do Django:
Usar o esquema admin-admin para este exemplo

```bash
docker exec -it audit_backend python manage.py createsuperuser
```

### 5.4 Teste local do backend

```bash
curl -i -X POST http://localhost:8000/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```

### 5.5 Teste público via Nginx

Substitua pelo IP da sua instância:

```bash
curl -i -X POST http://SEU_IP_PUBLICO/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```


# 6. Acesso à Aplicação

Abra um navegador e acesse:

```text
http://SEU_IP_PUBLICO

exemplo: http://54.234.151.6
```

# 7. Verificação do Proxy Nginx

Caso haja problemas de comunicação entre frontend e backend:

```bash
docker exec audit_frontend cat /etc/nginx/conf.d/default.conf
```

Esse arquivo define as regras de proxy reverso utilizadas pelo frontend.



# 8. Banco de Dados

## 8.1 Instalar dependências

```bash
sudo yum update -y
```

```bash
sudo yum install -y gcc python3-devel pkgconfig openssl-devel mariadb-connector-c mariadb-connector-c-devel
```

---

## 8.2 Aplicar Migrações

```bash
docker-compose exec backend python manage.py migrate
```

---

## 8.3 Inserir Dados Iniciais

```bash
docker-compose exec backend python controles/inserir_base/inserir_base.py
```

---

# 9. Comandos Úteis

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
