# 📱 GBK Técnico - Resumo Completo de Funções

## 🎯 Visão Geral
App mobile para gestão de instalações de internet, com análise de produtividade, relatórios e acompanhamento de metas mensais.

---

## 📋 TELAS E FUNÇÕES

### 1️⃣ **Dashboard** (index.tsx)
**Tela Principal - Resumo do Mês**
- ✅ Exibe meta mensal (104 instalações)
- ✅ Mostra progresso em tempo real
- ✅ Calcula valor total esperado
- ✅ Mostra faltam para atingir meta
- ✅ Breakdown por tipo de serviço (Instalação, Mudança, Tipo 3, Empresarial)
- ✅ Indicador visual com barra de progresso
- ✅ Filtro por bairro

**Funções Principais:**
- `calcularStats()` - Calcula estatísticas do mês
- `calcularValorPorTipo()` - Calcula valor por tipo de serviço
- `formatarMoeda()` - Formata valores em reais

---

### 2️⃣ **Novo Cadastro** (novo-cadastro.tsx)
**Criar Nova Instalação**
- ✅ Formulário com campos: Cliente, Endereço, Bairro, Tipo de Serviço, Observações
- ✅ Validação de bairro contra lista oficial (32 bairros)
- ✅ Seletor de tipo de serviço (Instalação, Mudança, Tipo 3, Empresarial)
- ✅ Salva automaticamente com data/hora
- ✅ Feedback visual de sucesso/erro
- ✅ Try-catch para tratamento de erros

**Funções Principais:**
- `handleSalvar()` - Salva nova instalação no contexto
- `validarBairro()` - Valida bairro contra lista oficial
- `validarCampos()` - Valida campos obrigatórios

---

### 3️⃣ **Editar Instalação** (editar-instalacao.tsx)
**Editar Instalação Existente**
- ✅ Carrega dados da instalação selecionada
- ✅ Campos editáveis: Cliente, Endereço, Observações
- ✅ Data e tipo de serviço como referência
- ✅ Botão Salvar com try-catch
- ✅ Botão Deletar com confirmação
- ✅ Feedback de sucesso/erro

**Funções Principais:**
- `handleSalvar()` - Salva alterações
- `handleDeletar()` - Deleta instalação com confirmação
- `deletarInstalacao()` - Remove do contexto

---

### 4️⃣ **Histórico** (historico.tsx)
**Visualizar Todas as Instalações**
- ✅ Lista todas as instalações do mês
- ✅ Filtro por bairro
- ✅ Busca avançada: data início/fim, valor mín/máx
- ✅ Ordenação: Recente, Antigo, Valor
- ✅ Botão Duplicar (cria nova com data de hoje)
- ✅ Botão Deletar com confirmação
- ✅ Exibe cliente, bairro, valor, data

**Funções Principais:**
- `handleBairroSearch()` - Filtra por bairro
- `handleSelectBairro()` - Seleciona bairro
- `duplicarInstalacao()` - Cria cópia com data atual
- `executarExclusao()` - Remove instalação
- `formatarData()` - Formata data (dd/mm/aaaa)
- `aplicarFiltros()` - Aplica filtros avançados
- `ordenarLista()` - Ordena por recente/antigo/valor

---

### 5️⃣ **Dashboard Pro** (dashboard-pro.tsx)
**Dashboard Avançado - Análise Profunda**
- ✅ Resumo mensal completo
- ✅ Meta esperada vs realizado
- ✅ Faltam para atingir meta
- ✅ Valor total realizado
- ✅ Breakdown por tipo de serviço
- ✅ Percentual de conclusão
- ✅ Indicador visual com cores

**Funções Principais:**
- `calcularStats()` - Calcula estatísticas
- `calcularValorPorTipo()` - Valor por tipo
- `calcularPercentual()` - Percentual de conclusão

---

### 6️⃣ **Análise** (analise.tsx)
**Análise Detalhada com Múltiplas Abas**

#### Aba: Meta
- ✅ Mostra progresso em relação à meta
- ✅ Calcula faltam para atingir
- ✅ Valor esperado vs realizado

#### Aba: Semanal
- ✅ Breakdown por semana do mês
- ✅ Mostra semanas 1-4
- ✅ Instalações por semana

#### Aba: Por Cliente
- ✅ Lista de clientes com total de instalações
- ✅ Ordenação por quantidade

#### Aba: Rentabilidade
- ✅ Valor total por tipo de serviço
- ✅ Percentual de cada tipo
- ✅ Valor médio por tipo

#### Aba: Tendências
- ✅ Gráfico de linha mostrando progresso
- ✅ Visualização de tendência ao longo do mês

#### Aba: Produtividade
- ✅ Instalações por dia
- ✅ Média diária
- ✅ Dias mais produtivos

#### Aba: Dia a Dia
- ✅ Calendário interativo com cores
- ✅ Filtro de meses (3, 6, 12)
- ✅ Indicador de desempenho (↑↓→)
- ✅ Gráfico LineChart comparativo
- ✅ Linha de meta (104 instalações)
- ✅ Previsão de fechamento
- ✅ Modal com relatório por dia
- ✅ Aba Comparação com histórico entre meses

**Funções Principais:**
- `analisarDiaADia()` - Análise dia a dia
- `calcularPrevisaoFechamento()` - Projeta fechamento
- `obterAlertas()` - Alertas de desempenho
- `compararComMesAnterior()` - Comparação histórica

---

### 7️⃣ **Calendário** (calendario.tsx)
**Visualização em Calendário**
- ✅ Calendário visual do mês
- ✅ Cores por desempenho (verde/amarelo/vermelho)
- ✅ Número de instalações por dia
- ✅ Seletor de ano (2026 e seguintes)
- ✅ Navegação ← → entre anos
- ✅ Clique em dia mostra relatório
- ✅ Filtro por bairro

**Funções Principais:**
- `obterInstalacoesPorDia()` - Agrupa por dia
- `obterCorPorDesempenho()` - Define cor do dia
- `handleDiaClick()` - Abre relatório do dia

---

### 8️⃣ **Gráficos** (graficos.tsx)
**Visualização em Gráficos**
- ✅ Gráfico de barras por tipo de serviço
- ✅ Gráfico de pizza (rentabilidade)
- ✅ Filtro por mês
- ✅ Dados globalizados

**Funções Principais:**
- `prepararDadosGrafico()` - Formata dados para gráfico
- `obterCoresPorTipo()` - Define cores por tipo

---

### 9️⃣ **Relatório por Bairro** (relatorio-bairro.tsx)
**Análise por Região**
- ✅ Breakdown de instalações por bairro
- ✅ Valor total por bairro
- ✅ Ordenação por quantidade/valor
- ✅ Filtro por período
- ✅ Indicador de desempenho por bairro

**Funções Principais:**
- `agruparPorBairro()` - Agrupa dados por bairro
- `calcularTotalPorBairro()` - Soma valores por bairro

---

### 🔟 **Tendências** (tendencia.tsx)
**Análise de Tendências**
- ✅ Gráfico de linha com progresso
- ✅ Tendência ascendente/descendente
- ✅ Projeção de fechamento
- ✅ Comparação com meses anteriores

**Funções Principais:**
- `calcularTendencia()` - Calcula tendência
- `projetarFechamento()` - Projeta resultado final

---

### 1️⃣1️⃣ **Configurações** (configuracoes.tsx)
**Gerenciamento de Dados e Preferências**

#### Seção: Aparência
- ✅ Toggle Modo Escuro

#### Seção: Modo de Pagamento
- ✅ Modo Atual: Fixo R$ 70
- ✅ Meta Mensal: 80 instalações
- ✅ Permite alterar valores

#### Seção: Agenda de Trabalho
- ✅ Seletor de dias de trabalho
- ✅ Segunda a Domingo

#### Seção: Dados
- ✅ Exportar CSV (salva em Downloads)
- ✅ Exportar Backup JSON (salva em Downloads)
- ✅ Restaurar Backup (importa JSON)
- ✅ Exportar Relatório (últimos 30 dias)

#### Seção: Compartilhamento
- ✅ Compartilhar CSV (WhatsApp, Email, etc)
- ✅ Compartilhar Backup (WhatsApp, Email, etc)
- ✅ Compartilhar Relatório (WhatsApp, Email, etc)

#### Seção: Zona de Perigo
- ✅ Limpar Todos os Dados (com confirmação)

**Funções Principais:**
- `exportarCSV()` - Exporta dados em CSV
- `compartilharCSV()` - Compartilha CSV
- `exportarBackup()` - Exporta JSON
- `compartilharBackup()` - Compartilha JSON
- `restaurarBackup()` - Importa JSON
- `exportarRelatorio()` - Gera relatório
- `limparTodosDados()` - Deleta tudo com confirmação

---

## 🔧 CONTEXTOS GLOBAIS

### 1. **InstallationsContext**
**Gerencia todas as instalações**
- `instalacoes[]` - Array de todas as instalações
- `adicionarInstalacao()` - Adiciona nova
- `atualizarInstalacao()` - Atualiza existente
- `removerInstalacao()` - Remove instalação
- `deletarInstalacao()` - Deleta com ID
- `paymentMode` - Modo de pagamento (fixo/meta)
- `monthlyGoal` - Meta mensal (104)
- `setPaymentMode()` - Altera modo
- `setMonthlyGoal()` - Altera meta

### 2. **MonthContext**
**Gerencia mês/ano selecionado**
- `mes` - Mês atual (1-12)
- `ano` - Ano atual (2026+)
- `irParaMes()` - Navega para mês/ano

### 3. **BairroFilterContext**
**Gerencia filtro de bairro**
- `bairroSelecionado` - Bairro atual
- `setBairroSelecionado()` - Altera bairro

### 4. **ThemeContext**
**Gerencia tema (claro/escuro)**
- `isDark` - Modo escuro ativo
- `toggleTheme()` - Alterna tema

---

## 📊 FUNÇÕES UTILITÁRIAS (lib/analytics.ts)

- `calcularStats()` - Calcula estatísticas do mês
- `calcularValorPorTipo()` - Valor por tipo de serviço
- `analisarDiaADia()` - Análise dia a dia com filtro de meses
- `calcularPrevisaoFechamento()` - Projeta fechamento do mês
- `obterAlertas()` - Alertas de desempenho
- `compararComMesAnterior()` - Comparação histórica

---

## 🏘️ DADOS DE BAIRROS (lib/bairros-lem.ts)

**32 Bairros/Loteamentos Cadastrados:**
1. Alto da Lagoa
2. Área Rural
3. Bahia Farm
4. Boa Vista
5. Centro
6. Cidade do Automóvel
7. Cidade Santa Cruz
8. Florais Léa
9. Jardim Alvorada
10. Jardim das Acácias
11. Jardim das Oliveiras
12. Jardim Imperial
13. Jardim Paraíso
14. Jardim Primavera
15. Mimoso do Oeste
16. Ondumar Marabá
17. Santa Cruz
18. Setor C Sul
19. Tropical Ville
20. Universitário
21. Novo Paraná
22. Jardim Paraíso II
23. Jardim Paraíso III
24. Cidade Santa Cruz II
25. Jardim das Acácias II
26. Jardim das Acácias III
27. Vereda Tropical
28. JK
29. Chiodi
30. Aroldo da Cruz
31. Chácaras Santa Cruz I
32. Chácaras Santa Cruz II

**Organizados em 6 Regiões:**
- Centro
- Santa Cruz
- Jardim Paraíso
- Boa Vista
- Universitário
- Zona Rural

---

## 🎨 TIPOS DE SERVIÇO

1. **Instalação** - R$ 65-70 (conforme meta)
2. **Mudança** - R$ 50
3. **Tipo 3** - R$ 40
4. **Empresarial** - R$ 100

---

## 📈 MÉTRICAS PRINCIPAIS

- **Meta Mensal:** 104 instalações
- **Valor Fixo:** R$ 70 por instalação
- **Valor Retroativo:** Ao atingir 104, todas viram R$ 70
- **Modo Meta:** Calcula valor baseado em atingir 104

---

## ✨ RECURSOS ESPECIAIS

- ✅ Modo Escuro/Claro
- ✅ Exportação CSV
- ✅ Backup JSON
- ✅ Compartilhamento WhatsApp/Email
- ✅ Calendário Interativo
- ✅ Gráficos Visuais
- ✅ Análise Dia a Dia
- ✅ Previsão de Fechamento
- ✅ Alertas de Desempenho
- ✅ Comparação Histórica
- ✅ Filtro por Bairro/Região
- ✅ Filtro por Período (3, 6, 12 meses)

---

## 🔐 VALIDAÇÕES

- ✅ Bairro validado contra lista oficial
- ✅ Campos obrigatórios validados
- ✅ Try-catch em todas operações assíncronas
- ✅ Confirmação em deletar/limpar
- ✅ Feedback visual de sucesso/erro

---

## 📱 PLATAFORMAS

- ✅ iOS (Expo Go)
- ✅ Android (Expo Go)
- ✅ Web (Metro)

---

**Última Atualização:** Junho 2026
**Versão:** 1.0.0
**Status:** ✅ Completo e Funcional
