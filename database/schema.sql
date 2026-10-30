-- CriaFatia - esquema relacional para MySQL 8.0+
-- Execute este arquivo antes de seed.sql.

CREATE DATABASE IF NOT EXISTS cria_fatia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE cria_fatia;

CREATE TABLE tamanhos (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(50) NOT NULL,
  quantidade_fatias TINYINT UNSIGNED NOT NULL,
  preco_base DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_tamanho_fatias CHECK (quantidade_fatias > 0),
  CONSTRAINT chk_tamanho_preco CHECK (preco_base >= 0)
);

CREATE TABLE massas (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(50) NOT NULL,
  acrescimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_massa_acrescimo CHECK (acrescimo >= 0)
);

CREATE TABLE molhos (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(50) NOT NULL,
  acrescimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_molho_acrescimo CHECK (acrescimo >= 0)
);

CREATE TABLE ingredientes (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nome VARCHAR(80) NOT NULL,
  acrescimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_ingrediente_acrescimo CHECK (acrescimo >= 0)
);

CREATE TABLE pedidos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo CHAR(12) NOT NULL UNIQUE,
  status ENUM('RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')
    NOT NULL DEFAULT 'RECEBIDO',
  valor_total DECIMAL(10,2) NOT NULL,
  observacao VARCHAR(500) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_pedido_total CHECK (valor_total >= 0)
);

CREATE TABLE pizzas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id BIGINT UNSIGNED NOT NULL,
  tamanho_id SMALLINT UNSIGNED NOT NULL,
  massa_id SMALLINT UNSIGNED NOT NULL,
  molho_id SMALLINT UNSIGNED NOT NULL,
  com_azeitona BOOLEAN NOT NULL DEFAULT FALSE,
  com_oregano BOOLEAN NOT NULL DEFAULT FALSE,
  preco_tamanho DECIMAL(10,2) NOT NULL,
  acrescimo_massa DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  acrescimo_molho DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  acrescimo_azeitona DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  acrescimo_oregano DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_pizza_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  CONSTRAINT fk_pizza_tamanho FOREIGN KEY (tamanho_id) REFERENCES tamanhos(id),
  CONSTRAINT fk_pizza_massa FOREIGN KEY (massa_id) REFERENCES massas(id),
  CONSTRAINT fk_pizza_molho FOREIGN KEY (molho_id) REFERENCES molhos(id),
  CONSTRAINT chk_pizza_valores CHECK (
    preco_tamanho >= 0 AND acrescimo_massa >= 0 AND acrescimo_molho >= 0
    AND acrescimo_azeitona >= 0 AND acrescimo_oregano >= 0 AND subtotal >= 0
  ),
  INDEX idx_pizza_pedido (pedido_id)
);

CREATE TABLE pizza_ingredientes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pizza_id BIGINT UNSIGNED NOT NULL,
  ingrediente_id SMALLINT UNSIGNED NULL,
  nome_personalizado VARCHAR(24) NULL,
  ordem TINYINT UNSIGNED NOT NULL,
  acrescimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_pizza_ingrediente_pizza
    FOREIGN KEY (pizza_id) REFERENCES pizzas(id) ON DELETE CASCADE,
  CONSTRAINT fk_pizza_ingrediente_catalogo
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id),
  CONSTRAINT uq_pizza_ingrediente_ordem UNIQUE (pizza_id, ordem),
  CONSTRAINT chk_pizza_ingrediente_origem CHECK (
    (ingrediente_id IS NOT NULL AND nome_personalizado IS NULL)
    OR (ingrediente_id IS NULL AND nome_personalizado IS NOT NULL)
  ),
  CONSTRAINT chk_pizza_ingrediente_ordem CHECK (ordem BETWEEN 1 AND 5),
  CONSTRAINT chk_pizza_ingrediente_acrescimo CHECK (acrescimo >= 0),
  INDEX idx_pizza_ingrediente_pizza (pizza_id),
  INDEX idx_pizza_ingrediente_catalogo (ingrediente_id)
);

