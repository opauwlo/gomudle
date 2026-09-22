# Gomudle

Jogo diário de adivinhar carta do One Piece Card Game. Página estática, sem
backend próprio e sem conta: tudo roda no navegador e o progresso mora no
`localStorage`. Só duas coisas vêm de fora, e as duas falham caladas: a arte
das cartas (por CDN de imagem) e o contador de quem já resolveu o desafio do
dia.

```bash
pnpm install
pnpm dev          # Vite
pnpm test         # vitest
pnpm typecheck    # tsc -b
pnpm build        # dist/
```

Como o projeto está organizado, as decisões de regra de jogo e as armadilhas
conhecidas estão em [NOTAS.md](NOTAS.md).

Licença: [MIT](LICENSE).
