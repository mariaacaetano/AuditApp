# Audit Premium

Sistema acadêmico para apoio a auditorias de segurança da informação, com foco em normas ISO/IEC 27002 e ISO/IEC 27701. A aplicação permite cadastrar empresas, criar auditorias, responder controles, anexar evidências, acompanhar dashboards, gerar relatórios e administrar usuários/códigos de acesso.

# Tutorial de Instalação
Este tutorial de instalação deve ser utilizado para fazer a instalação da aplicação e suas dependências na instância EC2, após a mesma ter sido criada e estar conectada.

### Instalar Git, Docker e Docker Compose

1. Atualizar os pacotes
```bash
sudo yum update -y
```

2. Instalar o Git
```bash
sudo yum install git -y
```

3. Instalar o Docker
```bash
sudo dnf install docker -y
```

4. Iniciar o Docker
```bash
sudo systemctl start docker
```

5. Configurar o docker para iniciar automaticamente
```bash
sudo systemctl enable docker
```

6. Adicionar o usuário ec2-user ao grupo do Docker
```bash
sudo usermod -aG docker ec2-user
```

7. Depois disso, sair da aba de conexão e abrir de novo.
```bash
exit
```

(Conectar novamente)
8. Verificando a instalação do Docker
```bash
docker --version
```

9. Baixar o executável do Docker Compose (para evitar erros posteriores)
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
```

Conceder permissão de execução ao arquivo Docker Compose
```bash
sudo chmod +x /usr/local/bin/docker-compose
```

Verificando a instalação do Docker Compose
```bash
docker-compose --version
```
### Aplicação

Clonando o repositório da aplicação
```bash
git clone https://github.com/mariaacaetano/AuditApp.git
```

Trocando para o repositório da aplicação
```bash
cd AuditApp
```

Conferir conteúdo baixado
```bash
ls -la
```

Abrir arquivo para edição (para incluir o IP no CORS)
```bash
nano docker-compose.yml
```
```bash
ALLOWED_HOSTS: "localhost,127.0.0.1,backend,auditapp.lsx.li,13.218.34.212"
CORS_ALLOWED_ORIGINS: "http://localhost,http://127.0.0.1,http://localhost:5173,http://127.0.0.1:5173,https://
auditapp.lsx.li,http://13.218.34.212"
```

Subir a aplicação com Docker Compose
```bash
docker-compose up -d --build
```

Verificar os containers
```bash
docker ps
```

Criar um superadmin (necessário para a aplicação)
```bash
docker exec -it audit_backend python manage.py createsuperuser
```

Fazer uma requisição HTTP para o endpoint de autenticação da API, testando a aplicação localmente
```bash
curl -i -X POST http://localhost:8000/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```

Fazer uma requisição HTTP para o endpoint de autenticação da API, testando a aplicação pelo Nginx público
```bash
curl -i -X POST http://13.218.34.212/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"admin"}'
```

### Fazer teste com o IP aberto em uma nova aba ou dispositivo

Conferir o arquivo de configuração do Nginx utilizado pelo container do frontend, para verificar como as requisições são tratadas e encaminhadas para o backend da aplicação
```bash
docker exec audit_frontend cat /etc/nginx/conf.d/default.conf
```

### Banco de dados da aplicação

Atualizar os pacotes
```bash
sudo yum update -y
```

Instalar as dependencias necessárias para compilar bibliotecas Python
```bash
sudo yum install -y gcc python3-devel pkgconfig openssl-devel mariadb-connector-c mariadb-connector-c-devel
```

Ir ao diretório da aplicação (lembrar de conferir as intalações no requirements.txt)
```bash
cd AuditApp/
```

Ativar o ambiente virtual
```bash
source venv/bin/activate
```

Fazer a instalação dos pacotes
```bash
pip install -r requirements.txt
```

Caso não dê certo, fazer a instalação manualmente
```bash
python3 -m pip install asgiref Django django-cors-headers django-extensions djangorestframework djangorestframework_simplejwt mysqlclient pillow PyJWT PyMySQL sqlparse gunicorn
```

Levantar o banco de dados
```bash
docker-compose up -d db
docker-compose run --rm backend python manage.py migrate
docker-compose run --rm backend python controles/inserir_base/inserir_base.py
```

Se o backend já estiver rodando
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python controles/inserir_base/inserir_base.py
```






