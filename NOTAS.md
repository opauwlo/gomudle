# Gomudle

Jogo diário de adivinhar carta do One Piece Card Game. Página estática, sem
backend, sem conta: tudo roda no navegador e o progresso mora no localStorage.

**Tudo aqui é escrito em português** — comentário, copy, commit, nome de
arquivo e de função. Só o que vem do dataset (nome de carta, tipo, texto de
efeito) fica em inglês, porque é assim que a carta é impressa. Não misture os
dois num mesmo texto.

### Tipo e categoria são coisas diferentes, e a confusão é do inglês

- **tipo** (`carta.tipos`) é o `Type` impresso no rodapé da carta: "Straw Hat
  Crew", "Navy", "Supernovas". São 106, e toda carta tem pelo menos um. É
  coluna da grade.
- **categoria** (`carta.categoria`) é líder, personagem, evento ou stage. No
  dataset ela vem como `card_type`. É dica pedida, nunca coluna.

Os dois são *Type* em inglês — a carta usa a mesma palavra pras duas coisas, e
o dataset só desempata porque uma é `types` e a outra é `card_type`. Em
português dá pra separar, e é por isso que se separa: sem isso, `carta.tipo` e
`carta.tipos` seriam duas colunas do jogo com uma letra de diferença.
Já se chamou "traço" o que hoje é tipo. Mudou pra bater com a carta impressa,
que é o que quem joga tem na mão.

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
  tipos.ts                 Carta, Pista, veredito (tipos do TypeScript)
  cartas.ts                carrega o JSON, busca por nome, código e os dois
  modos.ts                 os 3 modos: deck de cartas + colunas da grade
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
  precarregar.ts           baixa a arte antes de ela ser pedida (toca em DOM)
public/sw.js               cache local da arte. Não toca no app, só na imagem.
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
   **Com a identidade oculta a imagem também não é alvo de clique**
   (`pointer-events: none`). Sem isso, o botão direito em cima dela abre o menu
   de IMAGEM, e "abrir imagem em nova guia" mostra a carta do dia inteira — sem
   recorte, sem zoom, com o código dela no endereço. Era o jeito mais fácil que
   existia de furar o modo, e não exigia saber nada. Sem ser alvo, o clique
   atravessa pro painel e o menu que abre é o da página. Revelou a carta, o
   `pointer-events` volta: aí não tem mais segredo pra guardar.
   **Isso é tranca de porta, não cofre, e a diferença importa.** Quem abre as
   ferramentas do navegador vê o endereço na aba de rede, e não tem como
   impedir: quem pede a imagem é o navegador de quem joga. Esconder de verdade
   exigiria um servidor entregando a arte já recortada, e o jogo não tem
   servidor — é página estática, e isso é decisão, não limitação temporária.
   Vale travar o acidente e o impulso; não vale prometer mais que isso.
4. **Dica é pedida, vem em escada e nunca repete coluna da grade.** Duas coisas
   já foram feitas errado aqui: (a) a dica caía sozinha a cada N palpites, o
   que tirava da pessoa a única decisão que sobra depois de chutar; (b) o
   conjunto completo de palavras-chave era a primeira dica e derrubava 24
   candidatas pra 1 — dica que resolve a rodada não é dica, é botão de revelar
   resposta. Hoje a ordem é por força: quantidade de palavras-chave, o TIPO da
   carta, o conjunto de palavras-chave, a inicial do nome. No modo efeito não
   existe dica de palavra-chave, porque o texto exibido já traz os selos.
   A CATEGORIA ocupa essa vaga desde que o tipo da carta virou coluna da grade
   — e é a única dica que o deck único criou. Ela é forte (dizer "evento" corta
   1.111 pra 126) e é justamente por isso que fica aqui e não na grade: como
   dica, quem quer a informação escolhe pagar a marca por ela. Ver a 11.
   **Quem desenha o selo é `optcg-card-rules` (MIT)**, não CSS nosso: são seis
   formatos diferentes (habilidade, tempo, DON!!, Trigger, Counter, Once Per
   Turn) e aproximar isso à mão erra cor e formato de algum. Ver
   `componentes/SeloDePalavraChave.tsx`.
5. **Custo e vida dividem um rótulo neutro, na dica E na grade.** "Custo"
   fechado entregaria que a carta NÃO é líder, e "Vida", que é. Na grade eles
   são uma coluna só (`C/V`, "Custo ou vida" por extenso no `title`): um 4 ali
   pode ser custo 4 ou vida 4, e descobrir qual é faz parte do enigma agora
   que a categoria não divide mais os modos.
6. **O dia é o de Brasília, calculado com `Intl`.** Fuso do navegador faria o
   mesmo desafio ter cartas diferentes, e aí compartilhar resultado não
   significa nada.
7. **O sorteio percorre uma permutação, não sorteia solto.** Nenhuma carta
   repete antes de o deck inteiro sair. Quando entra coleção nova o deck cresce
   e a ordem se reordena — aceito, porque o que ficou salvo é o resultado, não
   uma recontagem do passado.
   **Isso só passou a ser verdade depois de um bug.** A frase acima descrevia a
   intenção; o código recalculava `cartaDoDia` a cada carga da página. Deck
   novo reordenava a permutação, a carta de hoje virava outra, e a rodada que a
   pessoa já tinha FECHADO reabria: os palpites dela continuavam salvos, só que
   agora comparados contra uma carta que ela nunca viu, e o modo voltava a
   aparecer como não jogado. Acontecia a cada publicação que mexesse no
   `cartas.json` — e num jogo que regenera o dataset quando sai coleção, isso é
   toda semana boa.
   Hoje `RodadaSalva` guarda o id da resposta, e o dia é fixado por ela: o
   sorteio só é consultado quando o dia ainda não começou. O deck pode mudar
   embaixo; o desafio de hoje é o que começou hoje.
   O `resumoDoDia` já estava certo, e é a pista de que era bug e não decisão:
   ele lê o `venceu` salvo, enquanto o modo aberto recalculava.
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

   Medido no deck unificado de 1.111 cartas, amostra de 400 respostas com
   semente fixa:

   | colunas | média | ≤5 palpites | pior caso | ambíguas |
   |---|---|---|---|---|
   | cor · C/V · poder · coleção | 6,14 | 52% | 18 | 221 (20%) |
   | **cor · C/V · poder · tipos · coleção** | **4,81** | **71%** | **14** | **67 (6%)** |
   | + categoria | 4,54 | 74% | 12 | 59 (5%) |
   | + categoria + atributo | 3,83 | 88% | 9 | 30 (3%) |

   A linha em negrito é a que está no ar. As duas pontas explicam por quê.

   **Sem a coluna de tipos o jogo não era difícil, era longo.** Seis palpites de média,
   metade das rodadas passando de cinco e UMA EM CADA CINCO cartas dividindo a
   linha inteira com outra. Difícil e longo não são a mesma coisa: pior caso
   de 18 palpites num jogo diário é maratona, não desafio. E o número é
   otimista — o jogador simulado tem memória perfeita e sempre chuta uma carta
   ainda possível; gente de verdade chuta a que lembra.

   **O tipo é a coluna que recompensa saber de One Piece.** É o `Type` impresso
   no rodapé da carta, não a categoria dela. Sozinha essa coluna leva a média de
   6,14 pra 4,81 e a ambiguidade de 20% pra 6%. "Straw Hat Crew", "Navy",
   "Supernovas": 106 tipos distintos, presentes em todas as 1.111 cartas. Quem conhece a obra deduz. É o contrário do bloco, e é por isso que
   um entra e o outro não — bloco é metadado de lançamento, saber é consulta,
   não dedução, e ele derrubava o deck num palpite só.

   **CATEGORIA não é coluna, de propósito.** Ela custa 0,27 palpite (4,81 →
   4,54) — pouco pra uma vaga inteira de largura numa grade que já tem cinco. E
   ela já vaza: "—" em Poder só acontece em evento e stage. Deduzir vale mais
   que ler. Onde ela entra é como DICA pedida (ver a 4), onde quem quer paga a
   marca por ela.

   **Atributo é a linha de "fácil demais":** 3,83 de média e 88% em cinco
   palpites é a zona onde o bloco estava. Não entra.

   Se for mexer nisso, meça antes — e cuidado com a armadilha: se o primeiro
   candidato for o sósia da resposta, a lista de candidatas nunca encolhe e a
   simulação não termina. Tem que tirar a carta já chutada a cada rodada.

   **A coluna de coleção é binária: bate ou não bate, sem seta.** Já foi
   ordenada por bloco uma vez, e voltou atrás no mesmo dia — ordenar coleção é
   o bloco entrando por uma fresta, e é justamente o bloco que derruba a
   dificuldade pro chão. Quem quiser tentar de novo: o código NÃO serve de
   ordem (OP, ST, EB e PRB são numeradas cada uma por conta própria, OP-15 e
   EB-04 saíram juntas), então a escala teria que ser o bloco outra vez — e aí
   vale refazer a tabela acima antes, não depois.

12. **Um deck só, com as quatro categorias de carta.** Líder, personagem,
   evento e stage disputam o mesmo sorteio: a categoria virou parte do enigma
   em vez de ser a divisão dos modos. O modo "Líder" deixou de existir junto — ele era o
   mesmo jogo com 142 cartas e uma coluna trocada.
   A régua de raridade abaixo só se aplica onde existe enchimento de booster:
   personagem (2.185 na fonte) e evento (410). Líder tem 142 no jogo inteiro e
   stage tem 48 — filtrar esses dois por raridade deixaria TRÊS stages, e um
   categoria com três cartas é resposta entregue no dia em que sai.
   Evento e stage não têm poder. Isso não é dado faltando: o "—" na coluna é
   informação, e é o que faz a categoria vazar sem precisar de coluna própria.

   **O deck de personagem é R, SR e SEC — C e UC ficam fora.** Também medido
   (ver o comentário em `scripts/gerar-cartas.mjs`): o tamanho do deck quase
   não mexe na média de palpites, porque a grade afunila rápido de qualquer
   jeito. O que cresce com C e UC é a ambiguidade (2% → 5% de cartas
   indistinguíveis) e a quantidade de cartas com o mesmo nome na busca — 32
   "Monkey.D.Luffy" hoje, 45 com tudo. R entra porque é carta que se joga.

   **A promo entra, mas só a inédita.** A régua de raridade acima NÃO se aplica
   a ela: promo de personagem tem raridade própria (`P`), então aplicar a régua
   ali derrubaria todas. O que corta promo é outra coisa — ela só entra se for
   carta que ainda não existe no jogo. `assinatura`, em
   `scripts/gerar-cartas.mjs`, compara a carta sem o que é embalagem (código,
   coleção, raridade, arte): se bate, é reimpressão e fica de fora.
   Hoje o filtro derruba zero, e isso é esperado, não bug: das 235 promo da
   fonte, 129 são arte alternativa e já saíam antes; as que sobram são carta
   de evento com efeito próprio. Existe um "Jinbe" promo e um "Jinbe" OP07-045
   e eles não têm nada em comum além do nome. A comparação fica de rede de
   segurança pra quando a fonte trouxer uma reimpressão de verdade — o gerador
   diz na saída quantas caíram.
   **Todas as promo moram numa coleção só, `P`.** Cada P-xxx virando a própria
   coleção faria a coluna "Col." ser impressão digital: valor único, que ou
   entrega a carta ou não diz nada.
   O que isso custou, medido: o deck de personagem foi de 702 pra 795 cartas, e
   as que dividem a linha inteira com outra passaram de 125 (18%) pra 170
   (21%) — 45 das 93 promo colidem entre si, porque compartilham a coleção `P`.
   Se um dia isso incomodar, o lugar de mexer é aqui, não na grade.

13. **Formato é parte da identidade do jogo, não um filtro de tela.** A chave
   do sorteio e do progresso é `modo:formato` (`personagem:standard`), então
   Standard e EGB têm carta do dia e sequência próprias. Mexeu na chave, zerou
   a estatística de todo mundo.
   **É por isso que o modo do deck único ainda se chama `personagem` no código
   e "Carta" na tela.** Quando líder, evento e stage entraram nele, renomear o
   id teria zerado a sequência de quem já jogava. Id é identidade de dado, nome
   é rótulo — e eles podem divergir sem problema.
   **E é por isso que o padrão não aparece na URL.** A tela inicial é `/`, sem
   hash: escrever `#personagem:standard` pra dizer "o de sempre" é barulho na
   barra de endereço, e ainda espalha um id interno que só continua existindo
   pra não zerar ninguém. Só o que foge do padrão vai pro hash — `#efeito`,
   `#egb`, `#efeito:egb`.
   A leitura não vai por posição: procura cada pedaço nas duas listas. É o que
   faz `#egb` sozinho funcionar (por posição, o primeiro pedaço só podia ser
   modo, e `#egb` caía no formato padrão) e o que mantém
   `#personagem:standard` abrindo onde abria, pra link salvo não morrer. Ver
   `jogo/endereco.ts`.
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
19. **O termômetro saiu, e a regra dele fica escrita pra quem quiser de volta.**
   Durante a rodada havia um "Sobraram 41 de 1.111 cartas" com barra. A ideia
   era boa e está anotada aqui de propósito: ver a conta cair transforma
   palpite errado em progresso visível, e sem isso o segundo chute errado
   parece igual ao primeiro. Saiu porque enche a tela de número no meio de uma
   rodada que já tem grade, dicas e campo de busca.
   Se voltar, duas coisas não podem mudar: mostra a CONTA, nunca a LISTA — ver
   QUAIS cartas sobraram acaba com o jogo em um clique — e conta grade E dica
   juntas, senão pedir dica não mexe no número e a ajuda parece de graça (ver
   `Cerco` em `jogo/candidatas.ts`, que continua lá inteiro e testado).
   **O afunilamento não sumiu do jogo**, só da rodada em andamento: ele aparece
   no fim ("1.111 → 41 → 6") e na mensagem de compartilhar, que é onde ele
   conta a história em vez de ocupar espaço.

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

   **A arte oficial tem 600×838, e esse é o teto de tudo.** É medido: o PNG do
   dataset e o mesmo endereço pedido ao CDN com largura bem maior voltam os
   três em 600×838. Como as fontes usam "sem ampliar", pedir acima disso não
   traz pixel nenhum — só um endereço diferente pro navegador baixar a mesma
   imagem de novo. Por isso a largura do modo arte É o teto, e ali não se
   anuncia 2×.
   Duas coisas estavam jogando qualidade fora no modo arte, e valem pra
   qualquer tela que amplie imagem:
   (a) **o `srcSet` não sabe de `transform`.** O navegador escolhe a variante
   pelo tamanho de LAYOUT da imagem, e o zoom por `transform: scale()` entra
   depois. Ele via 256px, pegava a variante de 360, e só então o zoom esticava
   pra 768. Quem amplia por transform tem que pedir a imagem grande de saída,
   não confiar no 2× do `srcSet`.
   (b) **a qualidade do WebP é por uso.** 76 foi calibrado num retângulo de
   40px, onde ninguém vê artefato. O modo arte põe uma lupa de 3× em cima do
   mesmo artefato — lá é 90.
   O que isso NÃO resolve: 600px mostrados em 1536 (celular 2× no zoom máximo)
   continua sendo ampliar 2,5×. Não existe pixel além do nativo. Se um dia a
   nitidez do primeiro palpite ainda incomodar, o lugar de mexer é a escala
   inicial em `jogo/arte.ts`, que é decisão de jogo — ver a 22.

   **A arte fica guardada no aparelho, e o service worker NÃO toca no app.**
   O endereço da imagem carrega código da carta, largura e qualidade, então
   cada endereço é arquivo imutável: é o caso perfeito pra cache-primeiro.
   `public/sw.js` intercepta só os três hosts de arte; HTML, JavaScript e CSS
   passam direto, sem cache nenhum. **Isso é a decisão, não um detalhe**:
   service worker servindo app shell guardado é o jeito clássico de deixar
   alguém presa numa versão antiga do site sem entender por quê, e cache de
   imagem não vale esse preço. Ele não é registrado em `pnpm dev` (atrapalha o
   recarregar) nem no build de arquivo único (seria um segundo arquivo), e
   falha calado: sem ele o jogo funciona igual.
   A imagem vem opaca, porque é outra origem sem CORS — dá pra desenhar, não
   dá pra ler o status daqui. Ou seja, um 404 entra no cache parecendo arte. O
   risco é limitado de propósito: a `<img>` falha, o jogo conta a falha e em
   três cartas troca de fonte, e a fonte nova tem outro endereço, logo outra
   chave. O pior caso é uma carta vindo do CDN reserva, não o jogo sem arte.
   Trocar `arte-v1` de nome invalida tudo, se um dia precisar.
   **A imagem chega em duas etapas, e a primeira custa menos de 1 kB.** Onde a
   imagem final é grande — o painel de fim (200px) e o modo arte (600px) — o
   endereço vem com uma PRÉVIA junto: a mesma arte em 32px de largura e
   qualidade 35. Esticada, ela é um borrão com as formas e as cores certas, que
   é tudo que se pede: dizer "a imagem é ESTA" enquanto ela não chega.
   As duas camadas moram no `background` da própria `<img>` — prévia em cima
   das cores da carta. Quando o arquivo de verdade termina de baixar, o
   navegador pinta por cima e a troca acontece sozinha: **sem estado, sem
   segunda tag, sem um quadro de tela vazia no meio**. Como é a mesma
   `<img>`, o `transform` do modo arte corta a prévia e a final igual.
   A miniatura NÃO tem prévia, de propósito: ela já tem 64px e chega em poucos
   kB, então ali seria uma requisição a mais pra economizar nada — e a lista de
   busca mostra doze de uma vez. A fonte que não redimensiona também não tem:
   ali "prévia" seria o PNG de impressão inteiro, exatamente o contrário.

   **O pré-carregamento aposta em duas coisas só:** a carta do dia dos outros
   modos (trocar de modo é o passo natural de quem terminou um) e a resposta
   do modo atual no tamanho da revelação. Sai com prioridade baixa e 1,5s
   depois da tela montar — aposta no que vem a seguir não pode atrasar o que a
   pessoa está olhando agora. O modo arte pede o tamanho grande dele, o que
   custa uns 150 kB pra quem nunca troca de modo: é o preço de aquele modo, que
   é uma imagem em tela cheia, abrir pronto.
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
