# Atividade 14 - Modelo, diagrama e dicionário de dados

## 1. Banco de dados escolhido

O projeto CriaFatia utilizará **MySQL 8**, um sistema gerenciador de banco de dados de modelo **relacional**.

### Justificativa

Os dados do sistema possuem estrutura bem definida e relacionamentos claros: um pedido contém uma ou mais pizzas; cada pizza escolhe um tamanho, uma massa e um molho; e cada pizza pode conter até cinco ingredientes. O modelo relacional ajuda a evitar duplicação, garante a integridade por meio de chaves estrangeiras e facilita consultas de produção e relatórios. O MySQL foi escolhido por ser gratuito, amplamente utilizado, bem documentado e adequado para uma futura API do projeto web.

O site atual é somente front-end (HTML, CSS e JavaScript). Portanto, o navegador não deve acessar o MySQL diretamente: a gravação real dos pedidos exigirá posteriormente uma API de back-end.

## 2. Modelo entidade-relacionamento

O arquivo `database/diagrama.dbml` contém o diagrama completo para importação no dbdiagram.io. As relações são:

- `pedidos` 1:N `pizzas` - um pedido possui uma ou mais pizzas.
- `tamanhos` 1:N `pizzas` - cada pizza possui exatamente um tamanho.
- `massas` 1:N `pizzas` - cada pizza possui exatamente uma massa.
- `molhos` 1:N `pizzas` - cada pizza possui exatamente um molho.
- `pizzas` 1:N `pizza_ingredientes` - uma pizza possui de um a cinco recheios.
- `ingredientes` 1:N `pizza_ingredientes` - um ingrediente do catálogo pode aparecer em várias pizzas.

`pizza_ingredientes` resolve o relacionamento N:N entre pizzas e ingredientes e também aceita um nome personalizado quando a opção “Outro ingrediente” é usada.

## 3. Regras de negócio representadas

- Cada pizza deve referenciar tamanho, massa e molho existentes.
- A ordem do recheio vai de 1 a 5, refletindo o limite atual da tela.
- Cada recheio usa um ingrediente do catálogo ou um nome personalizado, nunca os dois ao mesmo tempo.
- Azeitona e orégano são opcionais e não contam no limite de cinco recheios.
- Preços são copiados para a pizza no momento da compra, preservando o valor histórico mesmo se o catálogo mudar.
- O pedido acompanha o fluxo: recebido, em preparo, pronto, entregue ou cancelado.

## 4. Dicionário de dados

### Entidade: tamanhos

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | SMALLINT UNSIGNED | Sim | PK | Identificador numérico do tamanho. |
| codigo | VARCHAR(20) | Sim | UK | Código usado pelo sistema, como `broto`. |
| nome | VARCHAR(50) | Sim | - | Nome apresentado ao usuário. |
| quantidade_fatias | TINYINT UNSIGNED | Sim | - | Quantidade de fatias; deve ser maior que zero. |
| preco_base | DECIMAL(10,2) | Sim | - | Preço base do tamanho; não pode ser negativo. |
| ativo | BOOLEAN | Sim | - | Indica se a opção está disponível para novos pedidos. |

### Entidade: massas

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | SMALLINT UNSIGNED | Sim | PK | Identificador numérico da massa. |
| codigo | VARCHAR(20) | Sim | UK | Código usado pelo sistema, como `integral`. |
| nome | VARCHAR(50) | Sim | - | Nome apresentado ao usuário. |
| acrescimo | DECIMAL(10,2) | Sim | - | Valor somado ao preço base; padrão 0. |
| ativo | BOOLEAN | Sim | - | Indica se a massa está disponível. |

### Entidade: molhos

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | SMALLINT UNSIGNED | Sim | PK | Identificador numérico do molho. |
| codigo | VARCHAR(20) | Sim | UK | Código usado pelo sistema, como `sem-molho`. |
| nome | VARCHAR(50) | Sim | - | Nome apresentado ao usuário. |
| acrescimo | DECIMAL(10,2) | Sim | - | Valor adicional da escolha; padrão 0. |
| ativo | BOOLEAN | Sim | - | Indica se a opção está disponível. |

### Entidade: ingredientes

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | SMALLINT UNSIGNED | Sim | PK | Identificador numérico do ingrediente. |
| codigo | VARCHAR(40) | Sim | UK | Código usado pelo sistema, como `calabresa`. |
| nome | VARCHAR(80) | Sim | - | Nome apresentado ao usuário. |
| acrescimo | DECIMAL(10,2) | Sim | - | Valor adicional do ingrediente; padrão 0. |
| ativo | BOOLEAN | Sim | - | Indica se o ingrediente está disponível. |

### Entidade: pedidos

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | Sim | PK | Identificador interno do pedido. |
| codigo | CHAR(12) | Sim | UK | Código público da comanda. |
| status | ENUM | Sim | - | `RECEBIDO`, `EM_PREPARO`, `PRONTO`, `ENTREGUE` ou `CANCELADO`. |
| valor_total | DECIMAL(10,2) | Sim | - | Soma dos subtotais do pedido; não pode ser negativa. |
| observacao | VARCHAR(500) | Não | - | Instrução adicional para a produção. |
| criado_em | DATETIME | Sim | - | Data e hora de criação. |
| atualizado_em | DATETIME | Sim | - | Data e hora da última alteração. |

### Entidade: pizzas

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | Sim | PK | Identificador da pizza. |
| pedido_id | BIGINT UNSIGNED | Sim | FK | Pedido ao qual a pizza pertence. |
| tamanho_id | SMALLINT UNSIGNED | Sim | FK | Tamanho escolhido. |
| massa_id | SMALLINT UNSIGNED | Sim | FK | Massa escolhida. |
| molho_id | SMALLINT UNSIGNED | Sim | FK | Opção de molho escolhida. |
| com_azeitona | BOOLEAN | Sim | - | Indica inclusão de azeitona. |
| com_oregano | BOOLEAN | Sim | - | Indica inclusão de orégano. |
| preco_tamanho | DECIMAL(10,2) | Sim | - | Cópia do preço do tamanho no momento do pedido. |
| acrescimo_massa | DECIMAL(10,2) | Sim | - | Cópia do acréscimo da massa. |
| acrescimo_molho | DECIMAL(10,2) | Sim | - | Cópia do acréscimo do molho. |
| acrescimo_azeitona | DECIMAL(10,2) | Sim | - | Acréscimo de azeitona; 0 quando não escolhida. |
| acrescimo_oregano | DECIMAL(10,2) | Sim | - | Acréscimo de orégano; 0 quando não escolhido. |
| subtotal | DECIMAL(10,2) | Sim | - | Valor total desta pizza. |

### Entidade associativa: pizza_ingredientes

| Atributo | Tipo de dado | Obrigatório | Chave | Descrição / observação |
|---|---|---:|---|---|
| id | BIGINT UNSIGNED | Sim | PK | Identificador do recheio selecionado. |
| pizza_id | BIGINT UNSIGNED | Sim | FK | Pizza que recebe o ingrediente. |
| ingrediente_id | SMALLINT UNSIGNED | Condicional | FK | Ingrediente do catálogo; nulo para item personalizado. |
| nome_personalizado | VARCHAR(24) | Condicional | - | Nome digitado pelo cliente; usado somente sem `ingrediente_id`. |
| ordem | TINYINT UNSIGNED | Sim | UK composta | Ordem de montagem, entre 1 e 5; única por pizza. |
| acrescimo | DECIMAL(10,2) | Sim | - | Preço adicional registrado no momento do pedido. |

## 5. Como executar

No MySQL Workbench, abra e execute nesta ordem:

1. `database/schema.sql`
2. `database/seed.sql`

Para visualizar o diagrama, acesse <https://dbdiagram.io>, escolha **New Diagram** e cole o conteúdo de `database/diagrama.dbml`.

