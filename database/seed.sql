-- CriaFatia - dados iniciais equivalentes às opções do front-end
USE cria_fatia;

INSERT INTO tamanhos (codigo, nome, quantidade_fatias, preco_base) VALUES
  ('broto', 'Broto', 4, 29.90),
  ('medio', 'Médio', 6, 39.90),
  ('grande', 'Grande', 8, 49.90)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), quantidade_fatias = VALUES(quantidade_fatias), preco_base = VALUES(preco_base);

INSERT INTO massas (codigo, nome, acrescimo) VALUES
  ('normal', 'Massa Normal', 0.00),
  ('integral', 'Massa Integral', 4.00)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), acrescimo = VALUES(acrescimo);

INSERT INTO molhos (codigo, nome, acrescimo) VALUES
  ('com-molho', 'Com molho', 0.00),
  ('sem-molho', 'Sem molho', 0.00)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), acrescimo = VALUES(acrescimo);

INSERT INTO ingredientes (codigo, nome) VALUES
  ('mussarela', 'Mussarela'),
  ('calabresa', 'Calabresa'),
  ('frango', 'Frango Desfiado'),
  ('bacon', 'Bacon'),
  ('presunto', 'Presunto'),
  ('catupiry', 'Catupiry'),
  ('palmito', 'Palmito'),
  ('champignon', 'Champignon'),
  ('milho', 'Milho'),
  ('ervilha', 'Ervilha'),
  ('cebola', 'Cebola'),
  ('tomate', 'Tomate'),
  ('pimentao', 'Pimentão'),
  ('queijo-prato', 'Queijo Prato'),
  ('ovo', 'Ovo'),
  ('abobrinha', 'Abobrinha')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

