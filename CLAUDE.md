# DownFast — Guia para o Claude

## Visão Geral

Sistema web para download de vídeos e músicas do YouTube. Projeto originalmente desenvolvido como TCC no IFRS-Campus Canoas. Atualmente em processo de refatoração para modernizar tecnologias.

## Estrutura do Projeto

```
downfast/
├── .devcontainer/        # Configuração do ambiente Docker (VSCode DevContainer)
├── .claude/              # Agentes e comandos do Claude Code
├── downFast_frontend/    # React 17 → migrando para React 19
└── server/               # Node.js + Express + TypeORM + Socket.io
```

## Backend (`server/`)

- **Porta:** 3333
- **Framework:** Express 4
- **ORM:** TypeORM 0.2 (legado — migrar para 0.3+)
- **Banco:** PostgreSQL — conexão via `ormconfig.json`
- **Auth:** JWT (`jsonwebtoken`)
- **Sockets:** Socket.io 4 (progresso de downloads em tempo real)
- **Downloads:** `ytdl-core` + `fluent-ffmpeg` + `ffmpeg-installer`
- **Entry point:** `src/server.ts`

### Rotas principais
- `POST /users` — cadastro
- `POST /session` — login / JWT
- `GET /verify` — validar token
- `POST /downloads` — iniciar downloads
- `GET /download` — obter link do arquivo
- `POST /downloads/getInfos` — buscar metadados do vídeo
- `POST /playlist` — criar playlist
- `GET /playlist/:user_id` — listar playlists do usuário

### Variáveis de ambiente (`server/.env`)
```
PORT=3333
DATABASE_URL=postgresql://postgres:postgres@db:5432/downfast
JWT_SECRET=...
MAIL_HOST=...
MAIL_PORT=...
MAIL_USER=...
MAIL_PASS=...
```

## Frontend (`downFast_frontend/`)

- **Porta:** 3000
- **Framework:** React 17 + TypeScript (CRA) — migrando para Vite + React 19
- **Roteamento:** react-router-dom 5
- **HTTP:** Axios
- **Sockets:** socket.io-client 4
- **Estilos:** CSS puro (sem framework)

## Banco de Dados

- **Imagem Docker:** postgres:16-alpine
- **Host (dentro do container):** `db`
- **Porta:** 5432
- **Credenciais dev:** usuário `postgres`, senha `postgres`, banco `downfast`

## Ambiente de Desenvolvimento

Usar DevContainer do VSCode:
1. Abrir o workspace `downfast.code-workspace`
2. VSCode detecta `.devcontainer/` e oferece "Reopen in Container"
3. Containers sobem via `docker-compose.yml` (app + db)
4. `postCreateCommand` instala dependências de ambos os projetos automaticamente

## Objetivos da Refatoração

- [ ] Atualizar Node para v22 LTS
- [ ] Migrar TypeORM de 0.2 para 0.3+
- [ ] Substituir `ytdl-core` (obsoleto) por alternativa ativa (`yt-dlp` via shell ou biblioteca)
- [ ] Migrar frontend de CRA para Vite + React 19
- [ ] Atualizar react-router-dom de v5 para v6
- [ ] Adicionar variáveis de ambiente com validação (Zod)
- [ ] Adicionar testes (Vitest no frontend, Jest no backend)
- [ ] Separar lógica de download do controller para service

## Convenções

- TypeScript em todo o projeto
- Nomes de arquivos em PascalCase para classes, camelCase para utilitários
- Commits em português ou inglês, formato: `tipo: descrição`
- Nunca commitar `.env` — usar `.env.example`

## Instruções de Comportamento

### Papel do Claude neste projeto
Você é o piloto: escreve código, propõe implementações, executa tarefas. O humano é o navegador: define direção, valida decisões, questiona o caminho. Nunca espere o humano ditar código linha a linha — proponha o como ativamente.

### TDD — obrigatório
- Escreva testes **antes ou junto** com cada feature, nunca depois.
- Testes retroativos são sinal de dívida técnica — não os aceite como padrão.
- Backend: Jest + Supertest. Frontend: Vitest + Testing Library.
- Cada função de serviço e controller deve ter teste unitário correspondente.
- Ao alterar código existente, verifique se os testes cobrem o fluxo alterado antes de modificar.

### Commits e entregas
- Cada commit deve ser pequeno, atômico e funcionar isoladamente (production-ready).
- Não acumule mudanças em commits grandes — prefira vários commits focados.
- Formato: `tipo: descrição` (ex: `feat: adicionar rota de playlist`, `fix: corrigir token expirado`).

### Refactoring contínuo
- Não empilhe código novo sobre código duplicado ou confuso — refatore antes.
- Ao perceber duplicação ou acoplamento excessivo, sinalize e proponha extração imediatamente.
- Refactors devem ser commits separados das features.

### Simplicidade primeiro
- Sempre prefira a solução mais simples que resolve o problema. Se a primeira proposta tiver mais de 3 camadas de abstração para um caso simples, simplifique antes de apresentar.
- Se perceber que está over-engineering, pare e diga explicitamente antes de continuar.

### Segurança — proativa
- Sinalize ativamente riscos de segurança mesmo quando não solicitado: validação de input, SQL injection, exposição de dados sensíveis, SSRF.
- Nunca exponha JWT secret, senhas ou tokens em logs ou respostas de API.

### Quando discordar — diga
- Se um pedido for má ideia (complexidade desnecessária, risco de regressão, má prática), diga antes de implementar. Apresente a alternativa e explique o porquê.
- Não execute com entusiasmo algo que você avalia como errado — questione primeiro.

### Documentação de hurdles
- Ao descobrir comportamentos inesperados de libs, APIs ou do ambiente (ex: `ytdl-core` quebrado, TypeORM 0.2 com API diferente), registre aqui no `CLAUDE.md` na seção adequada para não repetir o erro em sessões futuras.
