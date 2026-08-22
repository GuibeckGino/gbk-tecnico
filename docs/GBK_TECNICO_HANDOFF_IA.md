# GBK Técnico — Especificação Completa para Continuidade por Outra IA

> **Objetivo deste documento:** fornecer contexto funcional, financeiro, técnico e visual suficiente para que outra IA possa analisar, depurar ou evoluir o GBK Técnico sem alterar regras históricas já acordadas.

| Item | Estado atual |
|---|---|
| Produto | **GBK Técnico** |
| Finalidade | Gestão de ordens de serviço (OS) de instalações técnicas, produtividade, faturamento e metas |
| Plataforma | Aplicativo mobile Expo/React Native, com suporte web para prévia de desenvolvimento |
| Idioma do produto | Português do Brasil |
| Estética | Premium dark: azul-marinho profundo, azul elétrico e dourado |
| Referência de versão | Checkpoint `bd5183a6` |
| Estado de qualidade recente | TypeScript sem erros; 25 testes Vitest ativos aprovados e 1 teste de autenticação intencionalmente ignorado |

---

## 1. Visão de Produto

O **GBK Técnico** é um aplicativo de controle operacional e financeiro para uma pessoa técnica que registra serviços realizados, acompanha metas mensais, observa produtividade e exporta informações para clientes, empresas ou gestão. A unidade operacional central é a **ordem de serviço (OS)**, registrada com cliente, bairro/endereço, tipo de serviço, data e observações.

O requisito mais sensível do produto é a **precisão histórica dos valores**. Um serviço não pode ser recalculado com a regra do mês atual: cada OS precisa utilizar o modo de pagamento e, quando existente, a tabela de preços do **mês/ano da sua própria data**. Essa regra existe para preservar relatórios, gráficos e análises após mudanças de preço.

O app foi concebido como **local-first**: os dados permanecem utilizáveis sem internet por meio de armazenamento local. Existe também uma nuvem opcional por conta autenticada, destinada a sincronizar as OS entre aparelhos. Uma futura integração direta com Google Drive está planejada visualmente, mas **não está ativa**, pois o projeto ainda não possui credenciais OAuth do Google Cloud.

---

## 2. Navegação Principal e Telas

A navegação inferior possui sete abas. Todas usam ícones relacionados à função e seguem o mesmo padrão visual de fundo escuro, superfícies azul-marinho, ações em azul elétrico e detalhes dourados.

| Aba | Arquivo principal | Finalidade e recursos |
|---|---|---|
| **Dashboard** | `app/(tabs)/index.tsx` | Resumo do mês selecionado, meta, valor acumulado, projeção, cartões por tipo de serviço e indicadores operacionais. |
| **Novo** | `app/(tabs)/novo-cadastro.tsx` | Cadastro de uma nova OS com cliente, bairro, tipo de serviço, data, observações e importação de CSV. |
| **Histórico** | `app/(tabs)/historico.tsx` | Consulta e edição rápida de OS, pesquisa, filtros, favoritos, duplicação, exclusão, contadores e valores aplicados. |
| **Gráficos** | `app/(tabs)/graficos.tsx` | Gráficos interativos, tooltips e alternância entre mês selecionado e histórico completo. |
| **Análise** | `app/(tabs)/analise.tsx` | Múltiplas análises: meta, semanal, clientes, mês a mês, rentabilidade, tendências, produtividade e dia a dia. |
| **Calendário** | `app/(tabs)/calendario.tsx` | Visualização das OS por data; deve respeitar corretamente as datas do calendário de 2026. |
| **Config** | `app/(tabs)/configuracoes.tsx` | Metas, modo de pagamento, preços mensais, dados, backup/restauração, nuvem e central de compartilhamento. |

### 2.1 Dashboard

O Dashboard trabalha com o mês e ano selecionados globalmente. Ele reúne indicadores de volume, faturamento, quantidade restante para a meta e projeção baseada em dias úteis. Há um filtro de bairro e cartões por tipo de serviço. O objetivo é responder rapidamente: **quantas OS foram feitas, quanto foi recebido, quanto falta para a meta e qual o ritmo necessário**.

O Dashboard não deve substituir as análises históricas. Ele é um retrato operacional predominantemente mensal, enquanto Gráficos e Análise oferecem comparações e séries temporais.

### 2.2 Nova Instalação

O fluxo de cadastro atual é visualmente premium e foi redesenhado conforme referências fornecidas pelo usuário. A tela possui:

| Campo ou controle | Regra atual |
|---|---|
| Cliente | Obrigatório; validação de 1 a 100 caracteres. |
| Bairro/Endereço | Obrigatório; deve ser selecionado da lista oficial de bairros de LEM. Há busca filtrada. |
| Tipo de serviço | Obrigatório; opções Instalação, Tipo 3, Mudança e Empresarial. |
| Data | Obrigatória; preenchida automaticamente com a data local atual no formato `dd/mm/aaaa`; editável pelo calendário. |
| Observações | Opcional; limite visual de 200 caracteres. |
| Importar CSV | Mantido como recurso secundário para importar múltiplas OS. |
| Salvar Instalação | Cria uma OS local, mostra resposta háptica e retorna ao Dashboard. |

Após salvar, cliente, bairro, tipo e observações são limpos; a data é restaurada para a **data local atual** para agilizar o cadastro seguinte. O seletor de data permite registrar OS retroativas ou futuras conforme necessário.

### 2.3 Histórico

O Histórico concentra a gestão de registros já criados. Seus recursos incluem busca por cliente/OS/endereço, filtros por tipo, filtros avançados, ordenação, favoritos, contadores do mês e total geral, duplicação, exclusão e edição rápida em modal. Tocar em um cartão permite editar cliente, endereço, tipo, data e observações sem perder ID, `createdAt` ou favorito.

Cada cartão deve exibir o valor efetivamente aplicado à OS, incluindo o valor unitário, calculado com a configuração do período daquela OS. Não simplificar esse valor usando apenas o modo atual do app.

### 2.4 Gráficos

A aba Gráficos possui um seletor de escopo:

| Escopo | Comportamento esperado |
|---|---|
| **Mês selecionado** | Mostra distribuição, barras e indicadores das OS do mês/ano em foco. |
| **Histórico completo** | Mostra a base acumulada de todas as OS, respeitando o valor aplicado em cada mês. |

Os gráficos incluem barras, semidonut/distribuição e linha de tendência. Tooltips devem exibir valores exatos e, quando pertinente, quantidades de instalações. Uma exigência explícita do usuário foi que o faturamento em Gráficos não fique limitado ao mês quando o escopo escolhido for histórico.

### 2.5 Análise

A tela de Análise possui abas internas. A arquitetura analítica está centralizada em `lib/analytics.ts`.

| Seção | Entrega funcional |
|---|---|
| Meta | Progresso, projeção de fechamento e alertas de desempenho. |
| Semanal | Agrupa OS por semana do ano e calcula volume/valor. |
| Cliente | Ranking de clientes por quantidade, valor, última instalação e distribuição por tipo. |
| Mês a mês | Volume, faturamento e crescimento percentual por mês; retorno limitado aos últimos 12 meses. |
| Rentabilidade | Valor total, valor médio, frequência e última instalação por cliente. |
| Tendências | Série mensal, média móvel e rótulo crescente/decrescente/estável. |
| Produtividade | Indicadores de ritmo de trabalho e comportamento operacional. |
| Dia a dia | Comparação acumulada de dias entre os últimos 3, 6 ou 12 meses. |

Todas as análises que produzem faturamento precisam receber os modos de pagamento por mês e, quando disponíveis, os preços customizados por mês. A análise dia a dia é principalmente quantitativa e compara instalações acumuladas, não o valor monetário.

### 2.6 Calendário

O calendário permite identificar OS distribuídas por data. O requisito explícito é suporte correto ao ano de **2026**, incluindo seleção de data e leitura de `dd/mm/aaaa`. Ao alterar qualquer implementação de data, deve-se preservar o formato brasileiro usado pelo armazenamento e pelos cálculos.

### 2.7 Configurações

Configurações é uma central de operação. Ela contém tema, metas, modo de pagamento, preços mensais, agenda de trabalho, dados, nuvem e compartilhamento. É também onde se encontra a central de backup e exportação.

---

## 3. Modelo de Dados

Uma OS usa a interface `Installation` em `types/installation.ts`.

```ts
interface Installation {
  id: string;              // `${Date.now()}-${random}`
  cliente: string;
  endereco: string;        // Atualmente representa bairro/endereço selecionado
  tipoServico: ServiceType;
  data: string;            // obrigatoriamente dd/mm/aaaa
  observacoes: string;
  createdAt: string;       // ISO
  isFavorito?: boolean;
}
```

Os tipos válidos são estritos:

```ts
type ServiceType = "Instalação" | "Tipo 3" | "Mudança" | "Empresarial";
```

Não alterar nomes desses tipos sem criar uma migração de dados e revisar filtros, ícones, relatórios, testes, gráficos e banco.

### 3.1 Identificadores e datas

O ID é gerado localmente com timestamp e segmento aleatório. `createdAt` serve como referência de criação/atualização local e também é usado pela camada online durante conversões. A data de serviço (`data`) é a fonte de verdade financeira e analítica: é ela que determina mês, ano, preço e modo de pagamento aplicáveis.

---

## 4. Regras Financeiras Críticas

> **Regra de ouro:** nunca aplicar uma regra de preço global atual a uma OS histórica. Use sempre a data da OS para resolver mês/ano, modo de pagamento e preço customizado.

### 4.1 Modos de pagamento

```ts
type PaymentMode = "meta" | "fixo65" | "fixo70";
```

| Modo | Regra para Instalação/Mudança sem preço customizado |
|---|---|
| `meta` | R$ 65 quando o total do mês é menor que 104; R$ 70 quando o total mensal é igual ou superior a 104. |
| `fixo65` | R$ 65 por serviço. |
| `fixo70` | R$ 70 por serviço. |

O limiar de meta padrão é **104 OS**, mas a meta mensal pode ser alterada pelo usuário. Atenção: há uma diferença conceitual possível a investigar: `calcularValorPorTipo` utiliza 104 como limiar fixo para modo `meta`, enquanto a meta configurável é carregada e exibida pelo contexto de instalações. Caso a evolução exija que a meta customizada altere também o gatilho de R$ 70, isso deverá ser implementado explicitamente e testado; não presumir que já acontece.

### 4.2 Preços por tipo de serviço

| Tipo | Regra padrão | Exceções e precedência |
|---|---:|---|
| Empresarial | R$ 100 | Preço customizado do mês substitui o padrão quando maior que zero. |
| Tipo 3 | R$ 60 a partir de **01/08/2026** | Preço customizado do mês tem precedência; antes de 01/08/2026, sem preço customizado, segue R$ 70 no modo `fixo70` ou R$ 65 nos demais modos. |
| Mudança | Segue modo de pagamento | Preço customizado do mês substitui o modo. |
| Instalação | Segue modo de pagamento | Preço customizado do mês substitui o modo. |

### 4.3 Marco histórico da Tipo 3

O valor de Tipo 3 foi alterado pelo usuário, mas **somente a partir de 1º de agosto de 2026**. Esta condição é implementada por `isAnteriorAgnosto2026(dataStr)` (o nome contém um erro de grafia histórico, mas a lógica é a referência atual).

| Período da OS Tipo 3 | Valor sem tabela customizada |
|---|---:|
| Antes de 01/08/2026 | R$ 70 se modo `fixo70`; R$ 65 nos demais modos. |
| A partir de 01/08/2026 | R$ 60. |

Não alterar R$ 60 para todas as OS Tipo 3 antigas. Esse foi um erro já corrigido em versões anteriores do projeto.

### 4.4 Preços customizados mensais

Uma tabela customizada contém os quatro valores:

```ts
interface CustomPrices {
  instalacao: number;
  tipo3: number;
  mudanca: number;
  empresarial: number;
}
```

Os preços são salvos por mês/ano em AsyncStorage. A chave conceitual usada em mapas históricos é `YYYY-MM`, enquanto a chave de armazenamento segue prefixo `@gbk_custom_prices_YYYY_MM`. A regra de resolução é:

1. Extrair mês/ano da data `dd/mm/aaaa` da OS.
2. Buscar preço customizado para esse mês/ano.
3. Resolver modo de pagamento daquele mês/ano.
4. Aplicar `calcularValorPorTipo` com tipo, quantidade mensal, modo, tabela e data da OS.

### 4.5 Funções financeiras centrais

| Arquivo | Responsabilidade |
|---|---|
| `types/installation.ts` | Tipos de domínio, cálculo unitário, estatísticas e geração de ID. |
| `lib/monthly-payment-mode.ts` | Chaves mensais, carregamento/salvamento AsyncStorage e resolução de valores configurados. |
| `lib/analytics.ts` | Cálculos agregados por semana, cliente, mês, tendências e rentabilidade. |

Ao implementar uma nova tela monetária, preferir `calcularValorConfiguradoDoMes` ou reproduzir integralmente a resolução mensal existente. Não chamar `calcularValorPorTipo` apenas com o modo atual sem data e sem tabela mensal quando se tratar de histórico.

---

## 5. Persistência Local

O armazenamento local utiliza `@react-native-async-storage/async-storage`.

| Dado | Chave/base |
|---|---|
| Lista de OS | `@gbk_instalacoes` |
| Modo de pagamento mensal | `@gbk_payment_mode_YYYY_MM` |
| Meta mensal | `@gbk_monthly_goal_YYYY_MM` |
| Preços customizados mensais | `@gbk_custom_prices_YYYY_MM` |
| Destino favorito de compartilhamento | `@gbk_preferred_share_target` |

O `InstallationsContext` é a fonte principal das OS locais. Ele carrega o JSON no início, atualiza um reducer para adicionar/editar/remover/limpar e persiste alterações automaticamente. Também oferece exportação JSON, importação JSON, favoritos e carregamento de configurações para o mês selecionado.

### 5.1 Backup e restauração

O aplicativo permite exportar os registros em JSON, reimportar um backup, exportar CSV e gerar relatório PDF. A importação valida apenas que o conteúdo seja um array e completa `createdAt` ausente com o instante atual. Uma IA que amplie backup deve considerar validação de esquema mais rigorosa, versionamento de formato e inclusão explícita de configurações mensais — hoje a exportação central de instalações não deve ser assumida como backup completo de todas as preferências mensais.

---

## 6. Nuvem e Autenticação

### 6.1 Proposta atual

O aplicativo possui uma **nuvem própria por conta**. A autenticação é iniciada por OAuth do ambiente e expõe nome/e-mail da conta autenticada. A interface permite conectar, sincronizar manualmente e desconectar. Dados continuam disponíveis localmente sem login.

### 6.2 Sincronização

`context/SyncContext.tsx` utiliza tRPC e expõe:

| Operação | Comportamento |
|---|---|
| Conectar conta | Inicia OAuth e atualiza o estado de autenticação. |
| Sincronizar | Busca registros remotos, mescla com locais e envia registros apenas locais. |
| Salvar OS | Envia campos da OS à nuvem para a conta autenticada. |
| Excluir OS | Propaga exclusões ao servidor. |
| Sincronização automática | Após mudanças locais, aguarda cerca de 900 ms e tenta enviar atualizações/exclusões. |
| Retorno ao app | Atualiza sessão de autenticação quando o app volta ao estado ativo. |

O backend tRPC possui, em essência, endpoints protegidos para `saveInstallation`, `getInstallations`, `deleteInstallation` e `getSyncLog`.

### 6.3 Política de mesclagem atual e limitação importante

A mesclagem atual (`lib/cloud-sync.ts`) é simples: utiliza o ID como chave, mantém todos os registros vindos da nuvem e adiciona locais que não existem remotamente. Ela **não resolve conflitos de edição do mesmo ID** usando `updatedAt`, não faz CRDT e não apresenta UI de conflito.

> Ao evoluir sincronização, trate conflito concorrente como requisito pendente. A recomendação é implementar `updatedAt` confiável, estratégia determinística (por exemplo, último update vence com aviso), log de versão e tela de resolução para alterações incompatíveis.

### 6.4 Google Drive

Há uma indicação visual de conexão futura com Google Drive. Ela não deve ser apresentada como recurso funcional. Para ativá-la, seria necessário criar projeto Google Cloud, habilitar Drive API, configurar OAuth Android/iOS/web e armazenar credenciais com segurança. Uma arquitetura adequada separaria:

| Finalidade | Escopo/área esperada |
|---|---|
| Sincronização silenciosa privada | Pasta `appDataFolder` do Drive ou nuvem própria. |
| Arquivos que o usuário possa localizar/compartilhar | Pasta visível do Drive ou compartilhamento nativo. |

---

## 7. Compartilhamento, CSV e PDF

A central de compartilhamento foi amplamente refinada na aba Configurações.

### 7.1 Pré-visualização

Antes de compartilhar CSV ou PDF, o app exibe modal de prévia:

| Arquivo | Conteúdo exibido antes de enviar |
|---|---|
| CSV | Cabeçalho e primeiras linhas do arquivo. |
| PDF | Período, total de OS, faturamento, modo de pagamento, distribuição por tipo e comparativo mensal. |

A prévia informa nome e tamanho do arquivo. O usuário pode voltar/cancelar, copiar o resumo ou confirmar compartilhamento.

### 7.2 Abertura da folha nativa

No Android, a folha nativa não abre de forma confiável sobre um `Modal` ativo. Por isso, ao confirmar, o aplicativo fecha a prévia, aguarda a animação e então chama o compartilhamento. Esse comportamento não deve ser removido sem teste em dispositivo físico.

### 7.3 Destino favorito

O usuário pode escolher `Todos os apps`, WhatsApp, WhatsApp Business ou Gmail. A preferência é persistida localmente.

| Plataforma/cenário | Resultado esperado |
|---|---|
| Android + destino instalado | O app tenta abrir o pacote diretamente com anexo. |
| App favorito indisponível ou não suporta o arquivo | O fluxo retorna para a folha nativa comum. |
| iOS ou web | Usa-se a folha nativa compatível ou o aviso de indisponibilidade; o direcionamento por pacote é específico de Android. |

Também existe botão para copiar o resumo via `expo-clipboard`.

### 7.4 Formatos e conteúdo

| Recurso | Tecnologia | Observação |
|---|---|---|
| CSV | FileSystem legado | Lista de OS com cliente, endereço, tipo, data, observações e valor. Revisar sempre se o cálculo de valor estiver usando regra mensal. |
| JSON | AsyncStorage/contexto | Backup/importação de OS. |
| PDF | `expo-print` | Relatório mensal com conteúdo HTML/relatório preparado. |
| Compartilhar | `expo-sharing` | Compartilhamento de arquivo para apps compatíveis. |
| Atalho Android | `expo-intent-launcher` | Tentativa de abrir pacote favorito com anexo e fallback. |

---

## 8. Design System e Diretrizes de Interface

O visual desejado é explicitamente **minimalista premium em modo escuro**. Os principais tokens estão em `components/premium-ui` e no tema global. Referências de cor recorrentes:

| Papel | Cor aproximada |
|---|---|
| Fundo geral | `#070C16` / azul-marinho quase preto |
| Superfícies | azul-marinho profundo |
| Ação principal | azul elétrico, aproximadamente `#1768E5` |
| Destaques/meta | dourado, aproximadamente `#F2B52B` |
| Texto primário | branco/cinza muito claro |
| Texto secundário | cinza azulado |
| Divisores | azul/cinza discreto |

Diretrizes práticas:

1. Preservar área segura, barra inferior e uso em portrait 9:16.
2. Priorizar cartões com bordas suaves, ícones contextuais e espaçamento generoso.
3. Botões primários devem ser azuis, textos legíveis e feedback de toque discreto.
4. Detalhes dourados devem reforçar meta, seleção ou relevância, não ocupar toda a tela.
5. Não reintroduzir telas de detalhes de OS removidas pelo usuário; edição rápida no Histórico é o fluxo preferido.
6. Evitar alertas intrusivos quando um toast/feedback não bloqueante puder ser usado.

### 8.1 Nova Instalação

Esta tela foi atualizada recentemente e deve ser referência para outros formulários. Tem cabeçalho de ação, cartão de formulário, ícones por campo, seleção de bairro pesquisável, botões de serviço com ícones, seletor de data, contador de observações e ação de salvar destacada.

---

## 9. Arquitetura Técnica

| Camada | Tecnologias e responsabilidades |
|---|---|
| Mobile | Expo SDK 54, React Native 0.81, React 19, TypeScript. |
| Navegação | Expo Router 6 e abas de React Navigation. |
| Estilo | NativeWind/Tailwind, StyleSheet e tokens premium. |
| Estado local | Context + reducer + AsyncStorage. |
| Dados remotos | tRPC 11, TanStack Query, Express e Drizzle ORM. |
| Banco online | MySQL via `mysql2` e Drizzle. |
| Autenticação | Fluxo OAuth integrado ao backend/ambiente. |
| Gráficos | `react-native-chart-kit`, SVG e tooltips próprios. |
| Arquivos | Expo FileSystem legado, Print, Sharing, Document Picker. |
| Integrações móveis | Haptics, Clipboard, Intent Launcher, Calendar, Secure Store e outras dependências Expo. |
| Testes | Vitest. |

### 9.1 Provedores globais

O layout raiz combina, de forma geral, tema, área segura, contexto de instalações, seletor de mês, agenda de trabalho, filtro de bairro, tRPC/React Query e sincronização online. Ao criar um contexto novo, ele deve ser conectado no layout raiz antes de ser usado por um hook descendente.

### 9.2 Scripts úteis

| Comando | Uso |
|---|---|
| `pnpm dev` | Servidor backend e Expo web simultaneamente. |
| `pnpm check` | TypeScript sem emissão. |
| `pnpm test` | Vitest. |
| `pnpm lint` | Expo lint. |
| `pnpm db:push` | Gera/aplica migrações Drizzle. |

---

## 10. Testes Existentes

O projeto possui testes de lógica, não testes E2E completos de UI nativa. Entre as áreas cobertas estão bairros, períodos de gráficos, sincronização/mesclagem, regras financeiras, máscaras de entrada, modos mensais de pagamento, edição rápida, prévias de compartilhamento e tema.

| Arquivo de teste | Cobertura principal |
|---|---|
| `financial.test.ts` | Valores por tipo e transição da Tipo 3. |
| `monthly-payment-mode.test.ts` | Chaves, resolução mensal e regras históricas. |
| `input-masks.test.ts` | Formatação de data atual e validade no formato brasileiro. |
| `cloud-sync.test.ts` | Mesclagem local/nuvem e remoções. |
| `share-preview.test.ts` | Conteúdo de prévias, nome e tamanho de arquivo. |
| `chart-period.test.ts` | Escopo mensal versus histórico. |
| `quick-edit.test.ts` | Preservação de campos relevantes na edição rápida. |

Sempre rodar, no mínimo:

```bash
pnpm check
pnpm test
git diff --check
```

---

## 11. Limitações Conhecidas e Pontos de Atenção para Evolução

| Tema | Situação atual | Direção recomendada |
|---|---|---|
| Conflitos de nuvem | Mesclagem por ID sem resolução de edição concorrente. | Implementar `updatedAt`, estratégia de conflito e UI de revisão. |
| Google Drive | Apenas placeholder visual; sem credenciais. | Adicionar OAuth Google somente após projeto Google Cloud e escopos adequados. |
| Backup completo | JSON pode representar OS, mas configurações mensais precisam de confirmação/inclusão explícita. | Criar esquema de backup versionado com OS, metas, modos e preços. |
| Meta e preço Meta | Limiar financeiro do modo `meta` está codificado em 104 em função central. | Decidir se meta editável deve alterar também esse limiar; escrever testes antes de mudar. |
| Cálculo em exportação CSV | Há implementações históricas que merecem auditoria para garantir preço mês a mês. | Centralizar cálculo em helper mensal e testar exportações com meses distintos. |
| Web | Compartilhamento de arquivo nativo depende de ambiente móvel. | Exibir aviso claro e oferecer download no web se necessário. |
| Alertas | Alguns fluxos ainda usam `Alert`. | Substituir sucessos por toast premium não bloqueante. |
| Teste em aparelho | Parte do compartilhamento/Intent depende de Android real. | Validar WhatsApp, Gmail e fallback em build de desenvolvimento ou produção. |

---

## 12. Regras de Não Regressão

Uma IA que altere o projeto deve obedecer às regras abaixo:

1. **Não alterar retroativamente Tipo 3 para R$ 60 antes de 01/08/2026**, exceto quando uma tabela customizada do mês determinar outro valor.
2. **Não usar somente o modo de pagamento atual em dados históricos**. Sempre resolver o período da OS.
3. **Não remover Calendário ou Configurações**; ambos foram explicitamente mantidos pelo usuário.
4. **Não reintroduzir a antiga tela de detalhes da OS** sem pedido explícito; Histórico com edição rápida é o padrão atual.
5. **Não quebrar o formato `dd/mm/aaaa`** em registros existentes, filtros, calendário e análises.
6. **Não fingir que Google Drive está conectado**. A nuvem atual é própria do app; Drive depende de configuração futura.
7. **Não substituir a folha nativa de compartilhamento por navegação interna**. WhatsApp e apps semelhantes devem aparecer pelo fluxo nativo ou atalho Android com fallback.
8. **Não remover o tema premium dark** ou misturar uma paleta clara sem solicitação do usuário.
9. **Preservar dados existentes** em refatorações de modelo, AsyncStorage, banco ou importação.
10. Antes de checkpoint, marcar tarefas concluídas em `todo.md` e rodar TypeScript/testes.

---

## 13. Perguntas Estratégicas que Outra IA Pode Investigar

1. A meta mensal ajustável deve influenciar apenas KPI/projeção ou também o ponto de virada do preço `meta` de R$ 65 para R$ 70?
2. Quais tabelas de preço devem entrar no backup JSON para restaurar integralmente meses antigos?
3. Como resolver simultaneamente a edição da mesma OS em dois aparelhos sem perda silenciosa de dados?
4. O CSV e o PDF devem informar explicitamente qual tabela de preço e modo mensal foram aplicados a cada OS?
5. Google Drive deve ser apenas backup manual, sincronização automática ou ambos?
6. Há necessidade de autenticação obrigatória ou deve permanecer opcional, preservando o uso offline?
7. Quais relatórios têm mais valor: por bairro, cliente, empresa, técnico, período ou tipo de serviço?

---

## 14. Prompt Sugerido para a Outra IA

Copie o trecho abaixo junto com este documento ao pedir análise a outra IA:

```text
Você está analisando o aplicativo mobile GBK Técnico. Leia integralmente a especificação recebida e trate as regras financeiras históricas como invariantes. Priorize identificar inconsistências entre cálculo, exportação, análises e sincronização. Não proponha mudanças que apliquem valores atuais a OS históricas. Avalie também arquitetura local-first, sincronização por conta, backup completo, conflitos multiaparelho, experiência de compartilhamento e consistência visual premium dark.

Para cada sugestão, informe: objetivo, impacto nos dados existentes, arquivos ou camadas afetadas, riscos de regressão financeira e plano de testes. Diferencie claramente correções necessárias de melhorias opcionais.
```

---

## 15. Mapa de Arquivos Relevantes

| Arquivo | Conteúdo |
|---|---|
| `types/installation.ts` | Modelo de OS e preço por tipo. |
| `lib/monthly-payment-mode.ts` | Modo e preço por mês/ano. |
| `lib/analytics.ts` | Motor de análises. |
| `context/InstallationsContext.tsx` | Estado e persistência local de OS, meta e modo. |
| `context/SyncContext.tsx` | Login e sincronização por conta. |
| `lib/cloud-sync.ts` | Transformação e mesclagem local/remota. |
| `app/(tabs)/index.tsx` | Dashboard. |
| `app/(tabs)/novo-cadastro.tsx` | Novo cadastro premium. |
| `app/(tabs)/historico.tsx` | Histórico e edição rápida. |
| `app/(tabs)/graficos.tsx` | Gráficos interativos. |
| `app/(tabs)/analise.tsx` | Análises detalhadas. |
| `app/(tabs)/calendario.tsx` | Calendário. |
| `app/(tabs)/configuracoes.tsx` | Configurações, backups, nuvem e compartilhamento. |
| `server/syncRouter.ts` | Endpoints tRPC de sincronização. |
| `server/db.ts` | Persistência MySQL/Drizzle. |
| `tests/*.test.ts` | Regras protegidas por testes. |

---

## 16. Encerramento

O GBK Técnico já reúne controle de OS, preços históricos por período, análise operacional, relatórios, backup, compartilhamento e nuvem opcional. A evolução deve preservar primeiro a **confiabilidade dos dados e das regras financeiras**, depois melhorar automação e experiência. O maior risco de regressão é permitir que configurações atuais contaminem meses antigos; o segundo é sincronização concorrente sem resolução de conflito.

Qualquer nova funcionalidade deve ser avaliada contra essas duas prioridades antes de ser implementada.
