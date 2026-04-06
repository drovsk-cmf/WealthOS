# ONIE ORB - Documentação Completa de Design e Implementação

## Documento de Referência

**Data de criação:** 01 de Abril de 2026
**Status:** Aprovado pelo Claudio (v15 final)
**Tecnologia:** Canvas 2D + Simplex Noise
**Componente React:** `<OnieLoader />` (a ser implementado)

---

## 1. Conceito

A Onie é a personificação do motor inteligente do Oniefy. É o maestro de todo o aplicativo, a entidade com quem o usuário interage. Não é uma funcionalidade; é a camada de experiência inteira.

### 1.1 Identidade

- **Nome:** Onie (derivado de Oniefy)
- **Gênero:** Sem gênero definido. Referências textuais neutras.
- **Voz narrativa:** Primeira pessoa ("Notei que sua fatura subiu 22%")
- **Uso natural:** "a Onie cuida disso", "pergunta pra Onie", "minha Onie disse que não é hora"

### 1.2 Manifestação Visual

O orb da Onie é uma esfera luminosa contendo voais (véus/faixas de cor) que fluem organicamente, com identidade própria usando a paleta Plum Ledger do Oniefy.

**Referência visual:** Aurora boreal capturada dentro de uma esfera de vidro. Fumaça colorida incandescente com emissão de luz própria.

### 1.3 Onde a Onie Aparece

| Contexto | Presença | Tamanho |
|----------|----------|---------|
| Briefing ao abrir o app | Animação + texto | Grande (120-180px) |
| Card de insight numa tela | Avatar pequeno + texto | Médio (48-64px) |
| Notificação push | Avatar como ícone | Pequeno (32-40px) |
| Simulação "Posso comprar?" | Animação enquanto calcula | Grande |
| **Qualquer loading/carregamento** | **Substitui TODOS os loaders** | Variável |
| Transação normal sem novidade | Não aparece | - |
| Telas de CRUD (cadastro, edição) | Não aparece | - |
| Alerta crítico | Animação + card prioritário | Médio-Grande |

**Regra fundamental:** A Onie aparece quando tem algo a dizer. Silêncio é competência.

---

## 2. Anatomia do Orb

### 2.1 Estrutura em Camadas

1. **Core (fundo):** Esfera com radial-gradient. Ponto de luz no canto superior esquerdo (42%, 38%). A cor do core muda conforme o estado emocional.

2. **Voais (5 camadas):** Formas orgânicas deformadas por simplex noise em 3 camadas sobrepostas. Cada voal tem cor, velocidade, fase e deformação independentes. Os voais fluem como tecido ao vento dentro da esfera.

3. **Highlight (topo):** Reflexo sutil de vidro no canto superior esquerdo. Branco com opacidade muito baixa (10%). Dá a sensação de esfera de vidro.

### 2.2 Forma dos Voais

Cada voal é uma forma fechada (path) com 72 pontos, onde cada ponto é deslocado por 3 camadas de simplex noise:

- **Camada 1 (d1):** Deformação principal. Amplitude = `deform * 0.45`. Escala do noise = `0.7 + voalIndex * 0.14`.
- **Camada 2 (d2):** Deformação de detalhe. Amplitude = `deform * 0.2`. Frequência 2x maior que d1.
- **Camada 3 (d3):** Turbulência lenta. Amplitude = `turbulence * 0.18`. Frequência 0.4x de d1. Também distorce o ângulo.

A forma base de cada voal é um lóbulo assimétrico:
```
lobe = 0.35 + 0.65 * |cos(angle * 1.3 + voalIndex * 0.8)|^1.2
```

### 2.3 Borda Invisível

O container tem `border-radius: 50%` com `overflow: hidden`. Os voais são desenhados maiores que o container (260% do tamanho) e são cortados pela borda circular. Os voais nunca extrapolam a esfera visualmente.

### 2.4 Blending

Modo de composição: `screen` (globalCompositeOperation). Faz as cores se mesclarem luminosamente onde se cruzam, como fumaça incandescente. Cores sobrepostas ficam mais brilhantes, não mais escuras.

### 2.5 Blur

Cada voal tem blur de `width * 0.018` pixels. Suaviza as bordas sem perder a identidade da cor.

---

## 3. Estados Emocionais

### 3.1 Tabela de Parâmetros (valores finais aprovados)

| Parâmetro | Neutro | Ouvindo | Processando | Falando | Alerta | Positivo |
|-----------|--------|---------|-------------|---------|--------|----------|
| `speed` | 0.3 | 0.12 | **1.7** | 0.35 | 0.7 | 0.35 |
| `deform` | 0.6 | 0.4 | 1.05 | 0.65 | 1.0 | 0.65 |
| `breathe` | 0.025 | 0.05 | 0.015 | 0.012 | 0.01 | 0.04 |
| `turbulence` | 0.8 | 0.5 | 1.2 | 0.85 | 1.2 | 0.75 |
| `contract` | 0 | 0.25 | 0 | 0 | 0 | 0 |
| `spasm` | 0 | 0 | 0.028 | 0.028 | 0 | 0 |
| `spasmFreq` | 0 | 0 | 1.6 | 1.6 | 0 | 0 |
| `colorShift` | 0 | 0 | **1** | 0 | 0 | 0 |

### 3.2 Descrição Comportamental por Estado

**Neutro / Saudação**
- Voais fluem lentamente com ondulações suaves. Como fumaça num dia sem vento.
- Respiração visível (breathe = 0.025): o orb expande e contrai suavemente.
- Tom: calma, competência, presença discreta.
- Paleta: roxo + esmeralda + lilás + verde + âmbar (padrão Plum Ledger).

**Ouvindo**
- Velocidade muito baixa (0.12). Voais quase parados.
- Cores mais escuras e concentradas.
- `contract = 0.25`: a esfera contrai suavemente como se estivesse "focando atenção".
- Respiração mais profunda (breathe = 0.05).
- Tom: concentração, atenção, "estou prestando atenção em você".

**Processando**
- Velocidade alta (1.7), quase 5x o falando.
- Deformação e turbulência elevadas: voais fluem com energia visível.
- **Oscilação cromática (`colorShift = 1`):** cada voal percorre lentamente toda a paleta de cores, trocando de cor de forma contínua e independente. É o diferencial visual em relação ao falando.
- Tom: energia, trabalho ativo, "estou pensando/calculando".

**Falando**
- Velocidade moderada (0.35), similar ao neutro.
- Espasmos sutis e longos (`spasm = 0.028, spasmFreq = 1.6`): ondulações gentis que passam pela superfície dos voais. Como a vibração suave de uma corda vocal.
- **Sem pulso rítmico.** Os espasmos são orgânicos e irregulares, não mecânicos.
- Tom: comunicação, "estou te dizendo algo".

**Alerta / Atenção**
- Paleta inteiramente vermelha escura (vermelho profundo, sem verde nem azul). Tom aterrorizante.
- Core muda para vermelho profundo [100, 0, 0].
- Velocidade moderada-alta (0.7), deformação alta (1.0).
- Tom: perigo, urgência visceral, "algo precisa da sua atenção imediata".

**Insight Positivo**
- Paleta inteiramente verde vibrante e luminoso. Tom animador e celebratório.
- Core muda para esmeralda profundo [0, 80, 50].
- Velocidade calma (0.35), respiração ampla (breathe = 0.04).
- Tom: boas notícias, celebração, "algo está indo bem".

### 3.3 Paletas de Cores (RGB)

**Neutro / Falando / Processando (paleta padrão):**
| Voal | R | G | B | Descrição |
|------|---|---|---|-----------|
| 1 | 168 | 85 | 247 | Roxo vibrante |
| 2 | 16 | 185 | 129 | Esmeralda |
| 3 | 192 | 132 | 252 | Lilás claro |
| 4 | 52 | 211 | 153 | Verde menta |
| 5 | 245 | 158 | 11 | Âmbar dourado |

**Ouvindo (paleta escurecida):**
| Voal | R | G | B |
|------|---|---|---|
| 1 | 120 | 60 | 220 |
| 2 | 14 | 160 | 110 |
| 3 | 160 | 100 | 230 |
| 4 | 40 | 180 | 130 |
| 5 | 200 | 130 | 10 |

**Alerta (paleta vermelha aterrorizante):**
| Voal | R | G | B |
|------|---|---|---|
| 1 | 220 | 20 | 20 |
| 2 | 180 | 0 | 0 |
| 3 | 255 | 50 | 30 |
| 4 | 200 | 10 | 10 |
| 5 | 160 | 0 | 20 |

**Positivo (paleta verde animadora):**
| Voal | R | G | B |
|------|---|---|---|
| 1 | 0 | 230 | 120 |
| 2 | 16 | 255 | 160 |
| 3 | 50 | 240 | 140 |
| 4 | 0 | 210 | 100 |
| 5 | 80 | 255 | 180 |

**Cores do Core (fundo da esfera):**
| Estado | R | G | B |
|--------|---|---|---|
| Neutro/Falando/Processando | 91 | 33 | 182 |
| Ouvindo | 60 | 20 | 150 |
| Alerta | 100 | 0 | 0 |
| Positivo | 0 | 80 | 50 |

### 3.4 Paleta de Cycling para Processando

Quando `colorShift = 1`, cada voal percorre ciclicamente estas 10 cores:
| # | R | G | B |
|---|---|---|---|
| 1 | 168 | 85 | 247 |
| 2 | 16 | 185 | 129 |
| 3 | 192 | 132 | 252 |
| 4 | 52 | 211 | 153 |
| 5 | 245 | 158 | 11 |
| 6 | 190 | 100 | 255 |
| 7 | 60 | 240 | 170 |
| 8 | 255 | 180 | 20 |
| 9 | 120 | 60 | 220 |
| 10 | 80 | 255 | 180 |

Velocidade do cycling: `time * 0.15 + voalIndex * 2`. Cada voal está defasado em 2 unidades, garantindo que não mudam de cor simultaneamente.

---

## 4. Transições entre Estados

Todas as transições são suaves. Os parâmetros interpolam linearmente com fator `0.03` por frame:
```
parametroAtual = parametroAtual + (parametroAlvo - parametroAtual) * 0.03
```

Isso vale para: velocidade, deformação, cores (R, G, B de cada voal), cor do core, contração, espasmos, e colorShift. O resultado é que a transição de Neutro para Alerta, por exemplo, leva ~2-3 segundos para completar, com as cores gradualmente virando vermelhas e o core escurecendo.

---

## 5. Escalas de Uso

O mesmo componente em 3 tamanhos:

| Uso | Tamanho do Canvas | CSS display size | Voais | Blur |
|-----|-------------------|------------------|-------|------|
| Inline (loader de botão, ícone em card) | 120x120 | 40-50px | 3 | blur(3px) |
| Card (insight, notificação) | 240x240 | 80-100px | 4-5 | blur(4-5px) |
| Briefing / Full loader | 360x360 | 150-180px | 5 | blur(6px) |

O canvas é renderizado em resolução 2x (retina) e exibido em metade do tamanho via CSS.

---

## 6. Loader Universal

A Onie substitui TODOS os elementos de loading do aplicativo:

- Skeleton screens → `<OnieLoader size="md" />`
- Spinners de botão → `<OnieLoader size="sm" />`
- Progress bars → `<OnieLoader size="md" />` com texto abaixo
- Tela de carregamento inicial → `<OnieLoader size="lg" />`

Nunca mais uma ampulheta genérica. Toda espera no app é acompanhada pela presença visual da Onie.

---

## 7. Especificação Técnica

### 7.1 Motor de Renderização

- **Tecnologia:** Canvas 2D (sem WebGL, sem bibliotecas externas)
- **Noise:** Simplex noise (implementação inline, ~30 linhas)
- **FPS:** requestAnimationFrame (~60fps)
- **Performance:** 5 voais com 72 pontos cada = 360 cálculos de noise por frame. Em Canvas de 360x360, ~0.5ms por frame. Negligível.

### 7.2 Por que Canvas e não SVG

SVG animate interpola linearmente entre keyframes pré-definidos. O resultado é "transição suave entre estados fixos", nunca "turbulência orgânica contínua". Canvas com simplex noise gera formas genuinamente imprevisíveis em cada frame. O movimento nunca se repete (MMC das durações > 2 milhões de segundos).

### 7.3 Compatibilidade

- Browser: Chrome, Safari, Firefox, Edge (todos suportam Canvas 2D)
- iOS via Capacitor: Canvas 2D funciona nativamente no WKWebView
- Performance em mobile: testado com 360x360 canvas, sem dropped frames em dispositivos de 2020+

### 7.4 Componente React (interface proposta)

```tsx
interface OnieLoaderProps {
  size: 'sm' | 'md' | 'lg';
  state?: 'idle' | 'listening' | 'processing' | 'speaking' | 'alert' | 'positive';
}

// Uso:
<OnieLoader size="lg" state="processing" />
<OnieLoader size="sm" /> // default: idle
<OnieLoader size="md" state="speaking" />
```

---

## 8. Código de Referência (Implementação Aprovada v15)

O código abaixo é a implementação completa aprovada na sessão de design. Deve ser portado para um componente React (`<OnieLoader />`) durante a fase de implementação.

### 8.1 Simplex Noise (inline)

```javascript
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const p = new Uint8Array(512);
const pm = new Uint8Array(512);

(function () {
  const v = new Uint8Array(256);
  for (let i = 0; i < 256; i++) v[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [v[i], v[j]] = [v[j], v[i]];
  }
  for (let i = 0; i < 512; i++) {
    p[i] = v[i & 255];
    pm[i] = p[i] % 12;
  }
})();

const g2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

function sn(x, y) {
  const s = (x + y) * F2;
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let a = 0, b = 0, c = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) { t0 *= t0; const g = g2[pm[ii + p[jj]]]; a = t0 * t0 * (g[0] * x0 + g[1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) { t1 *= t1; const g = g2[pm[ii + i1 + p[jj + j1]]]; b = t1 * t1 * (g[0] * x1 + g[1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) { t2 *= t2; const g = g2[pm[ii + 1 + p[jj + 1]]]; c = t2 * t2 * (g[0] * x2 + g[1] * y2); }
  return 70 * (a + b + c);
}
```

### 8.2 Parâmetros Completos

```javascript
const stateParams = {
  idle:       { speed: 0.3,  deform: 0.6,  breathe: 0.025, turb: 0.8,  contract: 0,    spasm: 0,     spasmF: 0,   cShift: 0 },
  listening:  { speed: 0.12, deform: 0.4,  breathe: 0.05,  turb: 0.5,  contract: 0.25, spasm: 0,     spasmF: 0,   cShift: 0 },
  processing: { speed: 1.7,  deform: 1.05, breathe: 0.015, turb: 1.2,  contract: 0,    spasm: 0.028, spasmF: 1.6, cShift: 1 },
  speaking:   { speed: 0.35, deform: 0.65, breathe: 0.012, turb: 0.85, contract: 0,    spasm: 0.028, spasmF: 1.6, cShift: 0 },
  alert:      { speed: 0.7,  deform: 1.0,  breathe: 0.01,  turb: 1.2,  contract: 0,    spasm: 0,     spasmF: 0,   cShift: 0 },
  positive:   { speed: 0.35, deform: 0.65, breathe: 0.04,  turb: 0.75, contract: 0,    spasm: 0,     spasmF: 0,   cShift: 0 },
};
```

### 8.3 Algoritmo de Desenho (por frame)

```
Para cada frame:
  1. Interpolar parâmetros atuais → parâmetros alvo (fator 0.03)
  2. Interpolar cores atuais → cores alvo (fator 0.03)
  3. Se colorShift > 0.01: aplicar cycling cromático por voal
  4. Limpar canvas
  5. Desenhar core (radialGradient com cor interpolada)
  6. Para cada voal (0..4):
     a. Calcular posição orbital: angle = time * speed * (0.25 + v * 0.13)
     b. Calcular offset do centro: rad * (0.2 + 0.08 * sin(time * 0.13 + v * 3))
     c. Se spasm > 0: aplicar modulação de tamanho via noise de baixa frequência
     d. Para cada ponto (0..72):
        - Calcular forma base (lóbulo assimétrico)
        - Aplicar 3 camadas de simplex noise
        - Se spasm > 0: aplicar ripple localizado
        - Converter para coordenada cartesiana
     e. Preencher com radialGradient (centro brilhante → bordas transparentes)
     f. Aplicar blur
  7. Desenhar highlight de vidro (reflexo branco sutil)
```

---

## 9. Decisões de Design Registradas

| # | Decisão | Data | Contexto |
|---|---------|------|----------|
| 1 | Onie é o nome do assistente (derivado de Oniefy) | 01/04/2026 | Sessão de redesign conceitual |
| 2 | Sem gênero definido, referências neutras | 01/04/2026 | Resposta às 17 perguntas |
| 3 | Fala em primeira pessoa | 01/04/2026 | Resposta às 17 perguntas |
| 4 | Orb abstrato sem rosto, com voais tipo aurora boreal | 01/04/2026 | Iteração v1-v7 |
| 5 | Canvas 2D + Simplex Noise (não SVG) | 01/04/2026 | Iteração v8, após análise de orbs de referência |
| 6 | Voais são tecidos orgânicos, não formas rígidas | 01/04/2026 | Feedback v7 → v8 |
| 7 | Alerta usa vermelho aterrorizante | 01/04/2026 | Feedback v9 |
| 8 | Positivo usa verde animador | 01/04/2026 | Feedback v9 |
| 9 | Falando: espasmos suaves e longos, sem pulso mecânico | 01/04/2026 | Feedback v9 → v10 |
| 10 | Processando e Falando: movimento quase igual, diferença é na oscilação cromática | 01/04/2026 | Feedback v11 |
| 11 | Processando: speed = 1.7 (aprovado em v15) | 01/04/2026 | Iteração v12 → v15 |
| 12 | Onie substitui TODOS os loaders do app (loader universal) | 01/04/2026 | Decisão de sessão |
| 13 | Cores Plum Ledger como base, mais vibrantes que o design system original | 01/04/2026 | Iteração v3 → v4 |

---

## 10. Evolução Futura (não implementar agora)

| Item | Descrição | Gatilho |
|------|-----------|---------|
| WebGL shader | Migrar de Canvas 2D para WebGL para efeito visual superior (blur por pixel, light emission real) | Se Canvas 2D mostrar limitação visual em telas grandes |
| Resposta a áudio real | Espasmos do "falando" sincronizados com amplitude de áudio real (Web Audio API) | Se implementar voz sintética |
| Interação por toque | Voais reagem ao toque do dedo (deformam na direção do toque) | Quando implementar interface conversacional |
| Temas sazonais | Paletas especiais para datas (Natal, Ano Novo, aniversário do usuário) | Pós-lançamento, engajamento |
