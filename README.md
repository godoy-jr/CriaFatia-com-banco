# 🍕 CriaFatia — Monta Pizza

Montador de pizza interativo em **HTML/CSS/JS puro** (arquivo único), onde o cliente monta a pizza do jeito que quiser — e o pizzaiolo recebe na hora uma **comanda de produção** com o passo a passo.

Projeto integrador de faculdade, inspirado na estética premium de sites cinematográficos (fundo escuro, tipografia display gigante, glows e animações).

---

## ✨ Funcionalidades

- **Tamanho**: Broto (4 fatias), Médio (6 fatias) e Grande (8 fatias)
- **Massa**: Normal ou Integral
- **Molho**: Com ou sem molho de tomate
- **Recheios**: até 5 ingredientes (com opção de acrescentar ingrediente personalizado)
  - 🧀 Mussarela · 🌶️ Calabresa · 🍗 Frango · 🥓 Bacon · 🍖 Presunto e mais
- **Azeitona 🫒 e Orégano 🌿**: confirmados no final e **não contam** nos 5 recheios
- **Resumo do pedido** com valores antes de confirmar
- **Comanda do pizzaiolo** gerada após a confirmação, com a ordem de montagem e opção de **imprimir**

## 🍕 Montagem em tempo real

A pizza é montada ao vivo ao lado do formulário:

- a pizza **cresce** conforme o tamanho escolhido
- o molho **espalha** sobre a massa
- os recheios **caem** um a um sobre a pizza
- azeitona e orégano aparecem no final
- no resumo, a pizza é **fatiada** no número de pedaços escolhido

## 🚀 Como executar

Basta abrir o `index.html` em qualquer navegador moderno.

> Nenhuma instalação, build ou servidor é necessário — tudo roda direto no navegador.

## 🧱 Estrutura

```
CriaFatia/
├── index.html   # estrutura da aplicação
├── style.css    # estilos premium dark
├── script.js    # lógica de montagem do pedido
├── database/    # esquema MySQL, carga inicial e diagrama DBML
├── ATIVIDADE_14_BANCO_DE_DADOS.md # documentação e dicionário de dados
└── README.md
```

## 🗄️ Banco de dados

A modelagem relacional da Atividade 14 está em `ATIVIDADE_14_BANCO_DE_DADOS.md`. Para criar o banco MySQL, execute `database/schema.sql` e depois `database/seed.sql`. O arquivo `database/diagrama.dbml` pode ser colado diretamente no dbdiagram.io.

## 🎨 Design

Visual "premium dark" inspirado em e-commerce cinematográficos:

- Paleta: preto `#050505` + laranja `#FF5500`
- Tipografia: **Anton** (display) + **Inter** (texto) via Google Fonts
- Título gigante com texto contornado, números de etapa em outline
- Palco do produto com brilho cônico rotativo ao redor da pizza

## 📄 Licença

Projeto acadêmico — uso livre para fins educacionais.
