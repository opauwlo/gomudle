# Gomudle

Jogo diário de adivinhar carta do One Piece Card Game. Página estática, sem
backend, sem conta: tudo roda no navegador e o progresso mora no localStorage.

**Tudo aqui é escrito em português** — comentário, copy, commit, nome de
arquivo e de função. Só o que vem do dataset (nome de carta, traço, texto de
efeito) fica em inglês, porque é assim que a carta é impressa. Não misture os
dois num mesmo texto.

## Comandos

```bash
pnpm dev          # Vite
pnpm test         # vitest, sem navegador
pnpm typecheck    # tsc -b
pnpm build        # dist/
pnpm build:unico  # dist-unico/index.html, jogo inteiro num arquivo só
pnpm cartas       # regera src/dados/cartas.json a partir do pacote npm
```

CI (`.github/workflows/ci.yml`): typecheck → test → build → confere se
`pnpm cartas` não muda nada. `deploy.yml` publica no Pages a cada push na `main`.

## Como está organizado

```
scripts/gerar-cartas.mjs   filtra e traduz o dataset -> src/dados/cartas.json
src/dados/cartas.json      GERADO e commitado. Não edite à mão.
src/jogo/                  regra de jogo, tudo puro e testado
  tipos.ts                 Carta, Pista, veredito
  cartas.ts                carrega o JSON, busca por nome, código e os dois
  modos.ts                 os 4 modos: deck de cartas + colunas da grade
  formatos.ts              Standard x EGB: o filtro de bloco que corta o deck
  candidatas.ts            quantas cartas ainda cabem nas pistas (o termômetro)
  comparar.ts              igual / parcial / diferente, e a seta ▲▼
  sorteio.ts               carta do dia (permutação com semente)
  dia.ts                   data em Brasília, número do desafio, contagem
  rodada.ts                venceu / encerrou / aplicar palpite
  progresso.ts             localStorage: rodada em andamento e estatísticas
  dicas.ts                 dicas progressivas e censura do nome no efeito
  palavras-chave.ts        explicação de cada palavra-chave da carta
  dicas.ts                 a escada de dicas que a pessoa PEDE, fraca -> forte
  compartilhar.ts          grade de emoji do Wordle
  imagens.ts               de onde vem a arte: CDN, tamanho por uso, fila de fontes
  useRodada.ts             o único arquivo de jogo/ que usa React
src/componentes/           UI
  icones.ts                o único arquivo que conhece a biblioteca de ícones
```

A regra: `src/jogo/` (menos `useRodada.ts`) não importa React nem toca em DOM.
É o que deixa tudo testável em milissegundos, sem jsdom.

## Decisões que já custaram caro

1. **Vitória é o ID bater, nunca "a grade toda verde".** Enel OP15-060 e
   OP15-118 têm características idênticas; aceitar grade verde daria a rodada
   por ganha com a carta errada. Ver `jogo/rodada.ts`.
2. **Desistir não pode virar vitória.** A primeira versão gravava a resposta no
   fim da lista de palpites pra tela ter o que mostrar, e no dia seguinte a
   rodada aparecia como ganha. A desistência tem flag própria.
3. **No modo arte, nem o `alt` da imagem nem o aviso de falha podem dizer que
   carta é.** Já entregou a resposta escrita no meio da tela. Ver
   `identidadeOculta` em `componentes/ImagemDaCarta.tsx`.
4. **Dica é pedida, vem em escada e nunca repete coluna da grade.** Duas coisas
   já foram feitas errado aqui: (a) a dica caía sozinha a cada N palpites, o
   que tirava da pessoa a única decisão que sobra depois de chutar; (b) o
   conjunto completo de palavras-chave era a primeira dica e derrubava 24
   candidatas pra 1 — dica que resolve a rodada não é dica, é botão de revelar
   resposta. Hoje a ordem é por força: quantidade de palavras-chave, depois o
   conjunto, depois a inicial do nome. No modo efeito não existe dica de
   palavra-chave, porque o texto exibido já traz os selos.
   **Quem desenha o selo é `optcg-card-rules` (MIT)**, não CSS nosso: são seis
   formatos diferentes (habilidade, tempo, DON!!, Trigger, Counter, Once Per
   Turn) e aproximar isso à mão erra cor e formato de algum. Ver
   `componentes/SeloDePalavraChave.tsx`.
5. **A dica de custo/vida tem rótulo neutro.** "Custo" fechado já entregaria que
   a carta é personagem, e "Vida", que é líder.
6. **O dia é o de Brasília, calculado com `Intl`.** Fuso do navegador faria o
   mesmo desafio ter cartas diferentes, e aí compartilhar resultado não
   significa nada.
7. **O sorteio percorre uma permutação, não sorteia solto.** Nenhuma carta
   repete antes de o deck inteiro sair. Quando entra coleção nova o deck cresce
   e a ordem se reordena — aceito, porque o que ficou salvo é o resultado, não
   uma recontagem do passado.
8. **`cartas.json` é commitado.** Build não pode depender de rede. O CI confere
   que o arquivo bate com o gerador.

9. **A busca quebra o texto em termos e cada termo tem que casar** com o nome
   ou com o código, e devolve TUDO que casou, sem corte. É isso que faz "op02-036 nami" e "op11 nami" funcionarem —
   procurar a string inteira não acharia nada. Nome e código são normalizados
   sem acento, pontuação nem caixa, porque o dataset escreve "Monkey.D.Luffy" e
   ninguém digita o ponto no lugar certo.
   A lista já cortou em 12 e avisou "e mais 40 — escreva o código pra afinar".
   Era pedir à pessoa exatamente o que ela não sabe: quem digita "luffy" está
   procurando entre os Luffy, e são 42. Hoje vem tudo e a lista rola.

10. **Ícone é componente, não emoji.** Tudo que é desenho na tela sai de
   `componentes/icones.ts` (Lucide) — emoji renderizava diferente em cada
   sistema e destoava dos selos das cartas. A ÚNICA exceção é
   `modos.emojiDeCompartilhamento` e a grade 🟩🟨⬛ de `compartilhar.ts`:
   mensagem de WhatsApp é texto puro, não aceita SVG.

11. **Não existe coluna de bloco, e isso é decisão medida.** Simulando um
   jogador de memória perfeita (que sempre chuta uma carta ainda possível):

   | colunas | média | ≤5 palpites | pior caso | com sósia |
   |---|---|---|---|---|
   | 8 (com bloco, atributo e contador) | 2,65¹ | — | 5 | 2 |
   | 7 (sem bloco) | 3,51 | 94% | 8 | 13 (2%) |
   | 5 (sem atributo nem contador) | 4,69 | 73% | 13 | 46 (7%) |
   | **4 (sem traços)** | **5,89** | **52%** | **15** | **125 (18%)** |

   ¹ medida no deck antigo, de 311 cartas.

   Bloco era a coluna mais informativa — cinco valores ordenados com seta — e
   fazia o deck desabar num palpite só. Atributo e contador saíram depois, a
   pedido: derrubam a média pra 4,7, que é a faixa do gênero, ao custo de 7%
   de cartas que dividem a linha inteira com outra (18 pares, 2 trios, 1
   quarteto). Nesses casos a linha avisa — "mesmas características, outra
   carta" — e custa um palpite, não a rodada. Coleção fica: tirá-la junto
   dobraria esse 7%.

   Bloco era a coluna mais informativa e fazia o deck desabar num palpite só.
   Coleção fica porque tirá-la custa quase nada em dificuldade (+0,09) e cria
   22 cartas que terminam a rodada com tudo verde e a carta errada. Se for
   mexer nisso de novo, meça antes: a simulação é umas 40 linhas em cima de
   `compararCarta`.

   **A coluna de coleção é binária: bate ou não bate, sem seta.** Já foi
   ordenada por bloco uma vez, e voltou atrás no mesmo dia — ordenar coleção é
   o bloco entrando por uma fresta, e é justamente o bloco que derruba a
   dificuldade pro chão. Quem quiser tentar de novo: o código NÃO serve de
   ordem (OP, ST, EB e PRB são numeradas cada uma por conta própria, OP-15 e
   EB-04 saíram juntas), então a escala teria que ser o bloco outra vez — e aí
   vale refazer a tabela acima antes, não depois.

12. **O deck de personagem é R, SR e SEC — C e UC ficam fora.** Também medido
   (ver o comentário em `scripts/gerar-cartas.mjs`): o tamanho do deck quase
   não mexe na média de palpites, porque a grade afunila rápido de qualquer
   jeito. O que cresce com C e UC é a ambiguidade (2% → 5% de cartas
   indistinguíveis) e a quantidade de cartas com o mesmo nome na busca — 32
   "Monkey.D.Luffy" hoje, 45 com tudo. R entra porque é carta que se joga.

13. **Formato é parte da identidade do jogo, não um filtro de tela.** A chave
   do sorteio e do progresso é `modo:formato` (`personagem:standard`), então
   Standard e EGB têm carta do dia e sequência próprias. Mexeu na chave, zerou
   a estatística de todo mundo.
14. **`BLOCO_MAIS_ANTIGO_NO_STANDARD` é número escrito à mão, e tem que ser.**
   A rotação anda um bloco todo 1º de abril; em abril de 2027 esse 2 vira 3.
   Derivar da data chutaria o futuro e faria o jogo mentir com cara de certeza
   no dia em que a Bandai mudar a regra.

15. **A paleta é a do REFS, com os nomes de lá.** `paper`, `surface`, `foil`,
   `selo`, `tinta`, `linha` — vocabulário de carta, não de software, e igual
   nos dois repositórios pra quem mexe nos dois não ter que traduzir nada. O
   que NÃO veio junto: os três temas (aqui só existe o escuro) e o
   `ink-panel`, que lá resolve um problema de tema que aqui não existe.
16. **A sequência premia aparecer, não acertar.** Uma só, do jogo inteiro,
   contando dia em que a pessoa terminou qualquer desafio — desistência
   inclusive. Eram oito (modo × formato) e isso é o contrário do que uma
   sequência serve: ela só funciona se der pra proteger.
17. **Dia de sósia é anunciado, nunca escondido.** Quando a carta do dia
   produz a linha inteira igual à de outra, o desafio ganha a etiqueta "dia
   difícil" antes do primeiro palpite. Quem sabe disso lê o ≠ como parte do
   jogo; quem não sabe conclui que o jogo quebrou. Ver `sosiasDe` e
   `diaDificil` em `jogo/candidatas.ts`.
18. **O termômetro conta grade E dica juntas.** Já esteve errado: nos modos com
   coluna ele só olhava a grade, então pedir dica não mexia no número e a ajuda
   parecia de graça. Ver `Cerco` em `jogo/candidatas.ts`.
19. **O termômetro mostra a CONTA, nunca a lista.** Ver quantas candidatas
   sobraram é o que transforma palpite errado em progresso; ver QUAIS
   acabaria com o jogo em um clique.

20. **A grade é planilha de MARCAS, não de valores.** Um cabeçalho só, grudado
   no topo, a primeira coluna é só a arte e cada célula tem só ✓ / ✕ / ▲ / ▼ /
   ≈. Repetir "Amarelo" embaixo de um X diz duas vezes a mesma coisa: quem
   escolheu a carta sabe o que ela tem, e o X já informa "não é essa cor". Com
   isso a linha caiu de ~200px pra 44px e dá pra varrer a coluna de um golpe de
   vista. O valor continua no `title` e no texto do leitor de tela.
   O `sticky` do cabeçalho quebra em silêncio se qualquer ancestral ganhar
   `overflow`: vira contexto de rolagem e ele passa a grudar nele.
   **A linha voltou a crescer, de propósito: hoje são ~76px.** A caixa da
   miniatura tem a proporção da carta impressa (`aspect-[63/88]`) e a imagem é
   `object-contain`, então a carta aparece INTEIRA. Antes eram 44px fixos com
   `object-cover`, que mostrava a faixa de cima e cortava a carta no meio — dava
   pra varrer a coluna, mas não pra reconhecer o palpite sem passar o mouse. A
   troca é essa: cabe menos palpite na tela de uma vez, e em troca a primeira
   coluna volta a valer alguma coisa. Quem mexer nisso decide de novo entre as
   duas, não existe terceira opção — a largura da coluna é 3.4rem e a altura
   sai dela.
21. **A arte passa por CDN de imagem, não por link direto no oficial.** O
   dataset guarda o endereço do site da Bandai, e apontar a `<img>` pra ele
   tinha dois problemas. O primeiro derrubou o jogo: quem pede a imagem é o
   navegador de quem joga, e link de fora nem sempre é aceito — a tela ficava
   sem arte nenhuma. O segundo é peso: o arquivo é PNG em tamanho de
   impressão, centenas de kB por carta, numa tela que mostra doze miniaturas
   enquanto a pessoa digita. Agora o endereço oficial vai DENTRO de um CDN de
   imagem: ele busca no oficial pelo servidor dele (não é mais o navegador de
   quem joga pedindo), converte pra WebP, entrega na largura que a tela usa de
   verdade e guarda em cache. São três fontes em fila — dois CDNs e o oficial
   cru no fim — e três cartas falhando na mesma fonte trocam a fonte do jogo
   inteiro, pra lista de doze não pagar doze vezes a mesma descoberta. Ver
   `jogo/imagens.ts`.
22. **O modo arte abre em 3×, não em 7,5×.** Zoom demais não é dificuldade, é
   sorteio: o que aparecia era uma mancha colorida, sem traço nem cenário pra
   deduzir, e ainda por cima feia — ampliar tanto estica um punhado de pixels
   da origem pela tela inteira. A escada agora vai de 3× a 1,08×, com desfoque
   leve que some no quarto passo, e a dificuldade mora no RECORTE. Ver
   `jogo/arte.ts`, que é onde ela é testada.

## Armadilhas

- **Toda leitura de `localStorage` passa por `progresso.ts` e falha em
  silêncio.** Aba anônima derruba `localStorage`, e derrubar o jogo por causa de
  estatística seria ridículo.
- **As miniaturas da busca usam a mesma arte da grade.** Falhou em todas as
  fontes, cada uma vira um quadrinho com o código da carta (`compacta` em
  `ImagemDaCarta`) — o aviso "arte indisponível" não cabe em 40px e vazava da
  lista de sugestões inteira.
- **Nenhuma fonte de arte é do projeto.** O jogo não hospeda imagem de carta —
  é material da Bandai — e os dois CDNs são serviço de terceiro: podem cair,
  mudar de parâmetro ou deixar de aceitar a origem. É por isso que existe fila,
  e é por isso que o fim da fila é o endereço oficial cru, que é o único que
  não depende de ninguém. Caiu a fila inteira, o modo arte cai no fallback e as
  dicas seguram a rodada — não é bug, é o combinado.
- **Hash de carta desloca com `>>>`, nunca com `>>`.** O hash de `focoDaArte`
  passa de 2³¹, e o deslocamento COM sinal devolve negativo — o resto vira
  porcentagem negativa e o recorte ancora fora da arte. Estava assim em 708 das
  840 cartas: o modo arte abria na borda de cima da moldura.
- **`BASE_PUBLICA` existe por causa do Pages**, que serve em `/gomudle/`. Build
  sem isso abre página em branco lá.
- **Cor sozinha não pode carregar informação.** Toda pastilha tem ícone (✓ ≈ ✕
  ▲ ▼) e um texto só pra leitor de tela.
