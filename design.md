# GBK Técnico — Design de Interface

## Visão Geral

Aplicativo mobile para técnicos de fibra óptica registrarem instalações em campo. Uso offline, rápido e direto. Orientação portrait, uso com uma mão.

---

## Paleta de Cores

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `primary` | `#1565C0` | `#42A5F5` | Botões principais, destaques |
| `background` | `#F5F7FA` | `#0F1117` | Fundo das telas |
| `surface` | `#FFFFFF` | `#1A1D27` | Cards, inputs |
| `foreground` | `#1A1A2E` | `#E8EAF0` | Texto principal |
| `muted` | `#6B7280` | `#9CA3AF` | Texto secundário |
| `border` | `#E2E8F0` | `#2D3748` | Bordas, divisores |
| `success` | `#16A34A` | `#4ADE80` | Confirmações, valores |
| `warning` | `#D97706` | `#FBBF24` | Alertas |
| `error` | `#DC2626` | `#F87171` | Exclusão, erros |

---

## Lista de Telas

### 1. Dashboard (Aba 1 — Home)

**Conteúdo:**
- Header com nome do app e mês atual
- Card de destaque: Total de instalações do mês + Valor total a receber (em verde, grande)
- 3 cards menores: contagem por tipo (Instalação, Tipo 3, Mudança)
- 2 botões de ação rápida: "Novo Cadastro" e "Ver Histórico"

**Layout:**
- ScrollView vertical
- Card principal no topo (bg-surface, borda arredondada, sombra leve)
- Row de 3 mini-cards abaixo
- Botões de ação na parte inferior

---

### 2. Novo Cadastro (Aba 2)

**Conteúdo:**
- Formulário com 5 campos:
  - Cliente (TextInput)
  - Endereço (TextInput)
  - Tipo de Serviço (Picker/Dropdown: Instalação | Tipo 3 | Mudança)
  - Data (DatePicker ou TextInput formatado dd/mm/aaaa)
  - Observações (TextInput multilinha)
- Botão "Salvar Instalação" (primário, largura total)

**Layout:**
- ScrollView com padding
- Campos com label acima, input abaixo
- Botão salvar fixo no final do formulário

---

### 3. Histórico (Aba 3)

**Conteúdo:**
- Header com total de registros
- FlatList de cards de instalação
- Cada card mostra: Nome do cliente, Tipo, Data, Valor individual (R$65 ou R$70)
- Cada card tem botões: Editar (ícone lápis) e Excluir (ícone lixeira)
- Modal de edição (mesmo formulário do Novo Cadastro)
- Confirmação antes de excluir

**Layout:**
- FlatList com separador
- Card com layout horizontal (info à esquerda, botões à direita)
- Modal bottom sheet para edição

---

### 4. Configurações (Aba 4)

**Conteúdo:**
- Seção "Aparência": Toggle Modo Escuro
- Seção "Dados":
  - Exportar CSV
  - Exportar Backup (JSON)
  - Restaurar Backup (importar JSON)
  - Limpar Todos os Dados (com confirmação)

**Layout:**
- ScrollView com seções agrupadas
- Cada item com ícone, label e ação (toggle ou botão)
- Confirmação modal para ações destrutivas

---

## Fluxos Principais

### Cadastrar instalação
Aba "Novo Cadastro" → preenche campos → toca "Salvar" → volta ao Dashboard com dados atualizados

### Editar instalação
Aba "Histórico" → toca ícone lápis no card → modal de edição abre → altera campos → salva → modal fecha, lista e dashboard atualizados

### Excluir instalação
Aba "Histórico" → toca ícone lixeira → confirmação aparece → confirma → item removido, lista e dashboard recalculados

### Atingir 104 instalações
Ao cadastrar a 104ª instalação → todos os valores no histórico mudam de R$65 para R$70 → dashboard recalcula automaticamente

---

## Regra Financeira

```
total < 104  → valorTotal = total × 65  (cada item mostra R$65)
total ≥ 104  → valorTotal = total × 70  (cada item mostra R$70, inclusive anteriores)
```

---

## Componentes Reutilizáveis

- `InstallationCard` — card de instalação no histórico
- `FormField` — label + input estilizado
- `ServiceTypePicker` — dropdown de tipo de serviço
- `ConfirmModal` — modal de confirmação genérico
- `SectionHeader` — cabeçalho de seção nas configurações
- `StatCard` — card de estatística no dashboard
