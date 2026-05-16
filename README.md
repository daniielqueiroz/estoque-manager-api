# Estoque Manager - API
[![WEB](https://img.shields.io/badge/Frontend-estoque--manager--web-black?logo=github)](https://github.com/daniielqueiroz/estoque-manager-web)

> API REST para gerenciamento de estoque e vendas.
> Permite o cadastro, consulta, atualização e remoção de produtos,
>  além do controle completo do ciclo de vendas e geração de relatórios por período.

---

## Stack Tecnológica

| Tecnologia     | Versão | Finalidade                                |
| -------------- | ------ | ----------------------------------------- |
| **Node.js**    | >= 18  | Runtime JavaScript                        |
| **TypeScript** | ^5.9   | Tipagem estática                          |
| **Express**    | ^5.2   | Framework HTTP                            |
| **Prisma ORM** | ^6.19  | Acesso ao banco de dados                  |
| **Zod**        | ^4.3   | Validação de dados de entrada             |
| **MySQL**      | ^8.0   | Banco de dados relacional                 |
| **tsx**        | ^4.21  | Execução de TypeScript em desenvolvimento |
| **tsup**       | ^8.5   | Compilação para produção                  |
| **dotenv**     | ^17    | Gerenciamento de variáveis de ambiente    |

---

## Arquitetura

O projeto segue uma **arquitetura modular em camadas**, onde cada domínio de negócio (produtos, vendas, dashboard) é organizado em um módulo independente e autocontido. As responsabilidades são divididas em quatro camadas bem definidas.

### Estrutura de Diretórios

```
src/
├── server.ts                  # Ponto de entrada da aplicação
├── app.ts                     # Configuração e criação do Express
├── routers.ts                 # Roteador raiz que monta os módulos
│
├── lib/
│   └── prisma.ts              # Instância singleton do PrismaClient
│
├── shared/
│   ├── errors/
│   │   └── AppError.ts            # Classe de erro customizado da aplicação
│   └── middlewares/
│       ├── errorHandler.ts        # Middleware global de tratamento de erros
│       └── validateRequest.ts     # Middleware de validação via Zod
│
└── modules/
    ├── products/
    │   ├── product-routes.ts      # Definição das rotas HTTP
    │   ├── product-controller.ts  # Tratamento de req/res HTTP
    │   ├── product-service.ts     # Regras de negócio
    │   ├── product-repository.ts  # Queries no banco de dados
    │   └── product-schema.ts      # Schemas Zod e tipos inferidos
    │
    ├── sales/
    │   ├── sale-routers.ts        # Definição das rotas HTTP
    │   ├── sale-controller.ts     # Tratamento de req/res HTTP
    │   ├── sale-service.ts        # Regras de negócio
    │   ├── sale-repository.ts     # Queries no banco de dados
    │   └── sale-schema.ts         # Schemas Zod e tipos inferidos
    │
    └── dashboard/
        ├── dashboard-router.ts     # Definição das rotas HTTP
        ├── dashboard-controller.ts # Tratamento de req/res HTTP
        ├── dashboard-service.ts    # Regras de negócio
        ├── dashboard-repository.ts # Queries no banco de dados
        └── dashboard-schema.ts     # Schemas Zod e tipos inferidos
```

### As Quatro Camadas

```
Requisição HTTP
      |
      v
  [ Routes ]       Define método HTTP, caminho e middlewares aplicados
      |
      v
  [ Controller ]   Extrai e valida parâmetros de rota/query; mapeia
      |            resultados do serviço para respostas HTTP (status + JSON)
      v
  [ Service ]      Contém toda a lógica de negócio: validações de estoque,
      |            cálculo de totais, prevenção de fraudes
      v
  [ Repository ]   Executa as queries via Prisma ORM; gerencia transações
                   atômicas e trata erros do banco de dados
```

### Decisões Arquiteturais Relevantes

**Soft Delete em produtos**
A exclusão de um produto não remove o registro do banco. Em vez disso, define o campo `deletedAt` com o timestamp atual. Todas as queries de listagem e busca filtram por `deletedAt: null`. Isso garante que o histórico de vendas e relatórios permaneça íntegro mesmo após a remoção do produto.

**Transações atômicas em vendas**
A criação e o cancelamento de uma venda utilizam `prisma.$transaction`, garantindo que a atualização do estoque dos produtos e a criação/alteração dos registros de venda ocorram de forma atômica. Em caso de falha em qualquer etapa, toda a operação é revertida.

**Preço calculado no servidor**
Ao criar uma venda, o `unitPrice` de cada item é sempre buscado diretamente do banco de dados, nunca aceito a partir do corpo da requisição. Isso previne manipulação de preços pelo cliente.

**Instância singleton do Prisma**
O arquivo `src/lib/prisma.ts` exporta uma única instância compartilhada do `PrismaClient`, evitando o esgotamento do pool de conexões com o banco.

**Tipagem end-to-end com Zod**
Os schemas Zod são a única fonte de verdade para os tipos de entrada. Os tipos TypeScript são todos derivados via `z.infer<typeof schema>`, garantindo que schema e tipos nunca fiquem dessincronizados.

**Listagens padronizadas com paginação e ordenação**
As rotas de listagem (`GET /products` e `GET /sales`) compartilham o mesmo contrato de paginação (`page`, `pageSize`) e ordenação (`sortBy`, `sortOrder`) validado com Zod. A resposta também segue um formato único (`data`, `total`, `page`, `pageSize`, `totalPages`) via helper de paginação, simplificando consumo no frontend e manutenção no backend.

**Busca textual no catálogo de produtos**
A listagem de produtos suporta `search` por nome e/ou categoria com filtro server-side na camada de repositório, mantendo o mesmo endpoint de listagem e evitando duplicação de rotas para cenários de busca.

**Timezone explícito para relatórios**
Os relatórios consideram o header `x-timezone` para agregações por dia e, quando ausente ou inválido, aplicam fallback seguro para `UTC`. Essa decisão evita divergência de datas entre cliente e servidor em consultas por período.

**Endpoints de export dedicados**
As rotas `/products/export` e `/sales/export` foram separadas das listagens paginadas para permitir extração de conjuntos completos de dados sem comprometer a semântica e a performance dos endpoints de consulta padrão.

**Tratamento centralizado de erros**
A aplicação utiliza um middleware global de erros (`errorHandler`) registrado no `app.ts` como última camada. Qualquer exceção lançada em qualquer ponto da aplicação é automaticamente capturada pelo Express 5 — que propaga erros síncronos e assíncronos sem necessidade de `try/catch` nos controllers — e encaminhada a esse middleware.

A classe `AppError` é usada nos services para sinalizar erros de negócio (ex: recurso não encontrado, estoque insuficiente) com o status HTTP correspondente. O `errorHandler` distingue três tipos de erro:

| Tipo de erro                    | Status                        | Origem                             |
| ------------------------------- | ----------------------------- | ---------------------------------- |
| `AppError`                      | Definido no lançamento        | Regras de negócio nos services     |
| `ZodError`                      | `400`                         | Validação de body, params ou query |
| `PrismaClientKnownRequestError` | `409` (P2002) / `404` (P2025) | Violações de constraint no banco   |
| Erro desconhecido               | `500`                         | Qualquer exceção não mapeada       |

---

## Endpoints da API

Todos os endpoints são prefixados com `/api`.

### Produtos — `/api/products`

| Método   | Rota                       | Descrição                                           |
| -------- | -------------------------- | --------------------------------------------------- |
| `POST`   | `/api/products`            | Cadastra um novo produto                            |
| `GET`    | `/api/products`            | Lista produtos ativos com paginação, sort e search  |
| `GET`    | `/api/products/export`     | Exporta todos os produtos ativos                    |
| `GET`    | `/api/products/:id`        | Busca um produto pelo ID (UUID)                     |
| `GET`    | `/api/products/:id/report` | Gera relatório de vendas de um produto por período  |
| `PUT`    | `/api/products/:id`        | Atualiza um produto (todos os campos são opcionais) |
| `DELETE` | `/api/products/:id`        | Remove um produto via soft delete                   |

#### GET /api/products — Query Params

| Parâmetro   | Tipo      | Obrigatório | Padrão      | Regras                                                                 |
| ----------- | --------- | ----------- | ----------- | ---------------------------------------------------------------------- |
| `page`      | integer   | Não         | `1`         | Mínimo `1`                                                             |
| `pageSize`  | integer   | Não         | `10`        | Entre `1` e `50`                                                       |
| `sortBy`    | string    | Não         | `updatedAt` | `name`, `price`, `category`, `quantity`, `createdAt`, `updatedAt`     |
| `sortOrder` | string    | Não         | `desc`      | `asc` ou `desc`                                                        |
| `search`    | string    | Não         | —           | Busca parcial em `name` **ou** `category`                              |

**Resposta (paginada):**

```json
{
  "data": [
    {
      "id": "uuid-do-produto",
      "name": "Teclado Mecânico",
      "description": "Teclado mecânico switches blue, ABNT2",
      "price": 299.9,
      "quantity": 50,
      "category": "Periféricos",
      "createdAt": "2025-01-10T15:00:00.000Z",
      "updatedAt": "2025-01-10T15:00:00.000Z",
      "deletedAt": null
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

#### POST /api/products — Corpo da requisição

```json
{
  "name": "Teclado Mecânico",
  "description": "Teclado mecânico switches blue, ABNT2",
  "price": 299.9,
  "quantity": 50,
  "category": "Periféricos"
}
```

| Campo         | Tipo    | Regras                          |
| ------------- | ------- | ------------------------------- |
| `name`        | string  | Mínimo 2, máximo 120 caracteres |
| `description` | string  | Máximo 250 caracteres           |
| `price`       | number  | Deve ser maior que zero         |
| `quantity`    | integer | Deve ser maior ou igual a zero  |
| `category`    | string  | Mínimo 3, máximo 50 caracteres  |

#### PUT /api/products/:id — Corpo da requisição

Todos os campos são opcionais. Campos não enviados não são alterados. Campos desconhecidos são rejeitados.

```json
{
  "price": 279.9,
  "quantity": 45
}
```

#### GET /api/products/:id/report — Query Params

```
GET /api/products/:id/report?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

| Parâmetro   | Formato  | Descrição                       |
| ----------- | -------- | ------------------------------- |
| `startDate` | ISO 8601 | Data/hora de início (inclusiva) |
| `endDate`   | ISO 8601 | Data/hora de fim (exclusiva)    |

Header opcional: `x-timezone` (ex.: `America/Sao_Paulo`). Se ausente/inválido, a API usa `UTC`.

**Resposta:**

```json
{
  "product": {
    "id": "uuid-do-produto",
    "name": "Teclado Mecânico",
    "price": 299.9,
    "quantity": 40,
    "category": "Periféricos"
  },
  "report": {
    "totalSales": 8,
    "totalProductsSold": 15,
    "totalRevenue": 4498.5,
    "dailySales": [
      {
        "date": "2025-01-10",
        "dailySales": 3,
        "productsSold": 5,
        "avgPrice": 299.9,
        "revenue": 1499.5
      }
    ]
  }
}
```

| Campo                                  | Descrição                                              |
| -------------------------------------- | ------------------------------------------------------ |
| `report.totalSales`                    | Total de transações de venda em que o produto apareceu |
| `report.totalProductsSold`             | Total de unidades vendidas no período                  |
| `report.totalRevenue`                  | Receita total gerada pelo produto no período           |
| `report.dailySales`                    | Detalhamento por dia                                   |
| `report.dailySales[].dailySales`       | Número de vendas no dia                                |
| `report.dailySales[].productsSold`     | Unidades vendidas no dia                               |
| `report.dailySales[].avgPrice`         | Preço médio praticado no dia                           |
| `report.dailySales[].revenue`          | Receita do dia                                         |

---

### Vendas — `/api/sales`

| Método  | Rota                    | Descrição                                      |
| ------- | ----------------------- | ---------------------------------------------- |
| `POST`  | `/api/sales`            | Registra uma nova venda                        |
| `GET`   | `/api/sales`            | Lista vendas com paginação e ordenação         |
| `GET`   | `/api/sales/export`     | Exporta vendas por intervalo de datas          |
| `GET`   | `/api/sales/:id`        | Busca uma venda pelo ID com detalhes completos |
| `GET`   | `/api/sales/report`     | Gera relatório de vendas por período           |
| `PATCH` | `/api/sales/:id/cancel` | Cancela uma venda e estorna o estoque          |

#### GET /api/sales — Query Params

| Parâmetro   | Tipo      | Obrigatório | Padrão      | Regras                                                   |
| ----------- | --------- | ----------- | ----------- | -------------------------------------------------------- |
| `page`      | integer   | Não         | `1`         | Mínimo `1`                                               |
| `pageSize`  | integer   | Não         | `10`        | Entre `1` e `50`                                         |
| `sortBy`    | string    | Não         | `createdAt` | `customerName`, `items`, `totalAmount`, `status`, `createdAt` |
| `sortOrder` | string    | Não         | `desc`      | `asc` ou `desc`                                          |

`sortBy=items` ordena pela quantidade de itens da venda.

#### GET /api/sales/export — Query Params

```
GET /api/sales/export?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

| Parâmetro   | Formato  | Descrição                       |
| ----------- | -------- | ------------------------------- |
| `startDate` | ISO 8601 | Data/hora de início (inclusiva) |
| `endDate`   | ISO 8601 | Data/hora de fim (inclusiva)    |

**Resposta:**

```json
[
  {
    "id": "uuid-da-venda",
    "customerName": "João da Silva",
    "totalAmount": 599.8,
    "status": "CONFIRMED",
    "createdAt": "2025-01-10T15:00:00.000Z",
    "updatedAt": "2025-01-10T15:00:00.000Z",
    "itemCount": 2
  }
]
```

#### POST /api/sales — Corpo da requisição

```json
{
  "customerName": "João da Silva",
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 2
    },
    {
      "productId": "uuid-de-outro-produto",
      "quantity": 1
    }
  ]
}
```

| Campo               | Tipo          | Regras                            |
| ------------------- | ------------- | --------------------------------- |
| `customerName`      | string        | Mínimo 2 caracteres               |
| `items`             | array         | Mínimo 1 item                     |
| `items[].productId` | string (UUID) | ID válido de um produto existente |
| `items[].quantity`  | integer       | Deve ser maior que zero           |

**Resposta do GET /api/sales (paginada):**

```json
{
  "data": [
    {
      "id": "uuid-da-venda",
      "customerName": "João da Silva",
      "totalAmount": 599.8,
      "status": "CONFIRMED",
      "createdAt": "2025-01-10T15:00:00.000Z",
      "updatedAt": "2025-01-10T15:00:00.000Z",
      "items": [
        {
          "id": "uuid-do-item",
          "saleId": "uuid-da-venda",
          "productId": "uuid-do-produto",
          "quantity": 2,
          "unitPrice": 299.9,
          "createdAt": "2025-01-10T15:00:00.000Z"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

#### GET /api/sales/report — Query Params

```
GET /api/sales/report?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

| Parâmetro   | Formato  | Descrição                       |
| ----------- | -------- | ------------------------------- |
| `startDate` | ISO 8601 | Data/hora de início (inclusiva) |
| `endDate`   | ISO 8601 | Data/hora de fim (exclusiva)    |

Header opcional: `x-timezone` (ex.: `America/Sao_Paulo`). Se ausente/inválido, a API usa `UTC`.

**Resposta:**

```json
{
  "totalSales": 15,
  "totalProductsSold": 28,
  "totalRevenue": 4500.0,
  "dailySales": [
    {
      "date": "2025-01-10",
      "dailySales": 3,
      "productsSold": 5,
      "avgPrice": 299.9,
      "revenue": 1499.5
    }
  ]
}
```

---

### Dashboard — `/api/dashboard`

| Método | Rota             | Descrição                                 |
| ------ | ---------------- | ----------------------------------------- |
| `GET`  | `/api/dashboard` | Retorna indicadores agregados por período |

#### GET /api/dashboard — Query Params

```
GET /api/dashboard?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

| Parâmetro   | Formato  | Descrição                       |
| ----------- | -------- | ------------------------------- |
| `startDate` | ISO 8601 | Data/hora de início (inclusiva) |
| `endDate`   | ISO 8601 | Data/hora de fim (exclusiva)    |

**Resposta:**

```json
{
  "totalSales": 15,
  "revenue": 4500.0,
  "averageTicket": 300.0,
  "totalProducts": 42
}
```

---

## Respostas de Erro

Todos os erros seguem um formato JSON consistente.

**Erro de negócio** — recurso não encontrado, estoque insuficiente, venda já cancelada, etc.

```json
{
  "message": "Produto não encontrado"
}
```

**Erro de validação** — body, params ou query inválidos:

```json
{
  "message": "Dados dos inputs não conformes com o solicitado",
  "errors": [
    {
      "code": "too_small",
      "path": ["name"],
      "message": "Nome deve ter pelo menos 2 caracteres"
    }
  ]
}
```

**Erro interno** — exceção não mapeada:

```json
{
  "message": "Erro interno na aplicação"
}
```

---

## Modelo de Dados

```
Product
  id          UUID (PK)
  name        String
  description String
  price       Float
  quantity    Int
  category    String
  createdAt   DateTime
  updatedAt   DateTime
  deletedAt   DateTime?   ← null = ativo; preenchido = removido (soft delete)

Sale
  id           UUID (PK)
  customerName String
  totalAmount  Float
  status       Enum: CONFIRMED | CANCELLED
  createdAt    DateTime
  updatedAt    DateTime

SaleItem
  id        UUID (PK)
  saleId    UUID (FK → Sale)
  productId UUID (FK → Product)
  quantity  Int
  unitPrice Float          ← capturado no momento da venda
  createdAt DateTime
```

---

## Como Executar em um Novo Ambiente

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior
- Uma instância de **MySQL** acessível

### 1. Clonar o repositório

```bash
git clone https://github.com/daniielqueiroz/estoque-manager-api.git
cd estoque-manager-api
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e preencha com os dados do seu ambiente:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e configure as variáveis:

```env
PORT=8080
DATABASE_URL="mysql://usuario:senha@host:porta/nome_do_banco"
```

**Exemplo com banco local:**

```env
PORT=8080
DATABASE_URL="mysql://root:minhasenha@localhost:3306/estoque_manager"
```

### 4. Executar as migrations (criar as tabelas)

```bash
npx prisma migrate dev
```

Esse comando cria o banco de dados caso ele não exista, aplica todas as migrations, gera o Prisma Client automaticamente e ao final roda o arquivo seed.ts da pasta prisma para popular o banco com dados mockados para teste.

### 5. Iniciar o servidor em modo desenvolvimento

```bash
npm run start:dev
```

O servidor será iniciado com hot reload via `tsx watch`. A saída esperada é:

```
Servidor rodando na porta 8080
```

### 6. Testar a API

Com o servidor em execução, faça uma requisição de teste:

```bash
curl http://localhost:8080/api/products
```

A resposta deve ser um array JSON (vazio `[]` se o banco estiver sem dados).

---

### Build para produção

Para compilar o projeto e gerar os arquivos JavaScript otimizados na pasta `dist/`:

```bash
npm run build
```

Para executar a versão compilada:

```bash
node dist/server.js
```

---

## Scripts Disponíveis

| Script          | Comando                  | Descrição                           |
| --------------- | ------------------------ | ----------------------------------- |
| Desenvolvimento | `npm run start:dev`      | Inicia com hot reload via tsx       |
| Seed            | `npm run populatedb`     | Popula o banco com dados de exemplo |
| Build           | `npm run build`          | Compila TypeScript para JavaScript  |
| Migrations      | `npx prisma migrate dev` | Cria o banco e aplica as migrations |
| Prisma Studio   | `npx prisma studio`      | Abre interface visual do banco      |
