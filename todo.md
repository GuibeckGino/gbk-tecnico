# GBK Técnico — TODO

## Setup e Branding
- [x] Gerar logo do app
- [x] Configurar app.config.ts com nome e logo
- [x] Configurar tema de cores (azul técnico)

## Contexto Global e Dados
- [x] Criar tipos TypeScript (Installation, ServiceType)
- [x] Criar InstallationsContext com estado global
- [x] Implementar lógica de cálculo financeiro retroativo
- [x] Implementar persistência com AsyncStorage (load/save)
- [x] Implementar geração de ID único

## Navegação
- [x] Configurar 4 abas: Dashboard, Novo Cadastro, Histórico, Configurações
- [x] Adicionar ícones para cada aba
- [x] Configurar tab bar com cores do tema

## Tela Dashboard
- [x] Card principal com total de instalações e valor total
- [x] 3 mini-cards por tipo (Instalação, Tipo 3, Mudança)
- [x] Botões de ação rápida (Novo Cadastro, Ver Histórico)
- [x] Atualização automática ao focar a tela

## Tela Novo Cadastro
- [x] Campo Cliente (TextInput)
- [x] Campo Endereço (TextInput)
- [x] Dropdown Tipo de Serviço (Instalação | Tipo 3 | Mudança)
- [x] Campo Data com formatação dd/mm/aaaa
- [x] Campo Observações (multilinha)
- [x] Botão Salvar com validação
- [x] Após salvar: atualizar estado global e voltar ao dashboard

## Tela Histórico
- [x] FlatList de instalações
- [x] Card com: cliente, tipo, data, valor individual
- [x] Botão Editar em cada card
- [x] Botão Excluir em cada card com confirmação
- [x] Modal de edição com formulário completo
- [x] Atualização automática após editar/excluir
- [x] Valor individual atualiza conforme regra retroativa

## Tela Configurações
- [x] Toggle Modo Escuro (persistido no AsyncStorage)
- [x] Exportar CSV (cliente, endereço, tipo, data, observações)
- [x] Exportar Backup JSON
- [x] Restaurar Backup JSON
- [x] Limpar todos os dados com confirmação

## Qualidade
- [x] Sem telas extras além das 4 especificadas
- [x] Todos os botões funcionais
- [x] AsyncStorage sincronizado em todas as operações
- [x] Regra financeira retroativa validada (100=6500, 103=6695, 104=7280, 105=7350)
- [x] Dados persistem após fechar e reabrir o app


## Bugs Críticos (Correção)
- [x] Exclusão no histórico não funciona — corrigir fluxo de remoção
- [x] Confirmação de exclusão deve funcionar corretamente
- [x] Limpar dados não pede confirmação
- [x] Limpar dados não funciona


## Navegação de Meses (Nova Funcionalidade)
- [x] Criar contexto MonthContext para armazenar mês/ano selecionado
- [x] Implementar funções de navegação (próximo mês, mês anterior)
- [x] Adicionar setas de navegação (◀ ▶) no Dashboard
- [x] Filtrar instalações por mês selecionado no Dashboard
- [x] Recalcular totais conforme mês selecionado
- [x] Atualizar Histórico para mostrar apenas instalações do mês
- [x] Persistir mês selecionado no AsyncStorage


## Novas Funcionalidades (Mantidas)
- [x] Implementar gráfico de tendência de faturamento dos últimos 6 meses
- [x] Adicionar botão para duplicar instalação no histórico
- [ ] Gerar relatório mensal em PDF (REMOVIDO - conflito com pdf-lib)


## Funcionalidades Adicionais (Fase 2)
- [x] Adicionar campo de busca por cliente no histórico
- [x] Adicionar filtro por tipo de serviço no histórico
- [ ] Implementar notificações de lembrete para inatividade (REMOVIDO)
- [ ] Integrar backup automático em nuvem (REMOVIDO)
- [ ] Sincronizar dados com servidor (REMOVIDO)

## Limpeza Final
- [x] Remover pdf-lib
- [x] Remover sincronização em nuvem (CloudSync)
- [x] Remover ReminderProvider
- [x] Remover seção de relatório PDF
- [x] Remover seção de sincronização em nuvem


## Novas Funcionalidades (Fase 3)
- [x] Implementar busca avançada com filtro por data range
- [x] Adicionar filtro por tipo de serviço na busca avançada
- [x] Adicionar filtro por valor (mín/máx) na busca avançada
- [x] Implementar botão de compartilhamento via WhatsApp
- [x] Implementar botão de compartilhamento via Email
- [x] Formatar mensagem de compartilhamento com dados do mês


## Funcionalidades Avançadas (Fase 4)

### Validações & UX
- [ ] M\u00e1scara de entrada para datas (dd/mm/aaaa)
- [ ] Valida\u00e7\u00e3o de cliente n\u00e3o vazio
- [ ] Confirma\u00e7\u00e3o ao sair do formul\u00e1rio sem salvar

### An\u00e1lise & Relat\u00f3rios
- [ ] Resumo semanal (total de instala\u00e7\u00f5es e valor)
- [ ] Compara\u00e7\u00e3o m\u00eas-a-m\u00eas (crescimento %)
- [ ] Estat\u00edsticas por cliente (quantas instala\u00e7\u00f5es, valor total)

### Organiza\u00e7\u00e3o
- [ ] Ordena\u00e7\u00e3o do hist\u00f3rico (mais recente, mais antigo, maior valor)
- [ ] Favoritar clientes frequentes
- [ ] Tags/categorias customizadas

### Notifica\u00e7\u00f5es & Lembretes
- [ ] Notifica\u00e7\u00e3o di\u00e1ria para registrar instala\u00e7\u00e3o
- [ ] Lembrete de cliente recorrente
- [ ] Alerta se n\u00e3o houver registros h\u00e1 X dias

### Integra\u00e7\u00e3o & Exporta\u00e7\u00e3o
- [ ] Gerar QR code com dados da instala\u00e7\u00e3o
- [ ] Enviar relat\u00f3rio autom\u00e1tico por email (agendado)
- [ ] Integra\u00e7\u00e3o com WhatsApp Business API


## Atualização v1.1.0 — Modo de Pagamento + Empresarial

### Modo de Pagamento
- [x] Adicionar campo paymentMode em Configurações
- [x] Opções: Meta Progressiva, Fixo R$65, Fixo R$70
- [x] Salvar em AsyncStorage (paymentMode)
- [x] Padrão: meta

### Tipo Empresarial
- [x] Adicionar "Empresarial" na lista de tipos de serviço
- [x] Empresarial sempre = R$100 (nunca muda)
- [x] Atualizar tipos no novo cadastro

### Regra de Cálculo Atualizada
- [x] Meta progressiva: < 104 = R$65, ≥ 104 = R$70 (retroativo)
- [x] Fixo R$65: todos = R$65 (Empresarial = R$100)
- [x] Fixo R$70: todos = R$70 (Empresarial = R$100)
- [x] Empresarial sempre = R$100
- [x] Meta conta todos os tipos (Instalação, Tipo 3, Mudança, Empresarial)

### Backup JSON Funcional
- [x] Criar arquivo real (não string temporária)
- [x] Usar Expo FileSystem
- [x] Salvar em Downloads/Documentos
- [x] Nome: gbk-tecnico-backup.json
- [x] Incluir: installations, settings, paymentMode, theme
- [x] Botão "Fazer Backup" funcional
- [x] Permitir compartilhar arquivo
- [x] Mostrar mensagem de sucesso

### Restauração de Backup
- [x] Aceitar JSON exportado
- [x] Restaurar: instalações, configurações, modo técnico
- [x] Validar integridade do arquivo
- [x] Atualizar dashboard/histórico após restaurar

### Atualização Automática
- [x] Dashboard atualiza ao cadastrar/editar/excluir
- [x] Histórico atualiza ao trocar modo
- [x] Valores recalculam automaticamente
- [x] Sem reiniciar app

### Build
- [x] Manter package name: com.gbk.tecnico
- [x] Incrementar versionCode: 3 → 4
- [x] Incrementar versionName: 1.1.0 → 1.1.1
- [x] Sem perder dados do usuário

## Atualização v1.1.1 — Correção de Backup JSON

### Backup JSON Corrigido
- [x] Criar arquivo físico real com timestamp
- [x] Usar expo-file-system para escrita
- [x] Usar expo-sharing para compartilhamento
- [x] Validar se arquivo foi criado
- [x] Abrir compartilhamento automático
- [x] Logs detalhados para debug
- [x] Feedback haptic de sucesso
- [x] Nome: gbk-tecnico-backup-YYYY-MM-DD.json

### Restauração Corrigida
- [x] Tratamento de erro robusto
- [x] Logs de cada etapa
- [x] Validação de integridade
- [x] Mensagens de erro específicas


## Atualização v1.3.0 — Correção Completa de Exportações (JSON, CSV, PDF)

### Exportação JSON
- [x] Corrigir com validação de arquivo
- [x] Logs detalhados para debug
- [x] Arquivo físico real com timestamp
- [x] Compartilhamento automático
- [x] Mensagens de erro específicas

### Exportação CSV
- [x] Gerar CSV com Cliente, Endereço, Tipo, Data, Observações, Valor
- [x] Validar se arquivo foi criado
- [x] Logs detalhados para debug
- [x] Compartilhamento automático
- [x] Mensagens de erro específicas

### Exportação PDF
- [x] Implementar com expo-print
- [x] Gerar HTML estruturado
- [x] Incluir resumo executivo
- [x] Tabela de instalações
- [x] Análise por tipo de serviço
- [x] Top 5 clientes
- [x] Comparativo com mês anterior
- [x] Compartilhamento automático
- [x] Logs detalhados para debug

## Atualização v1.2.0 — Relatório em PDF Detalhado

### Geração de PDF
- [x] Criar utilitário de geração de PDF com ReportLab
- [x] Implementar botão "Exportar Relatório PDF" em Configurações
- [x] Gerar arquivo: relatorio-gbk-tecnico-YYYY-MM.json (estruturado para PDF)

### Conteúdo do Relatório
- [x] Cabeçalho com período e data de geração
- [x] Resumo executivo (total instalações, valor total, meta)
- [x] Status da meta (atingida ou não)
- [x] Tabela detalhada com todas as instalações (cliente, tipo, data, valor)
- [x] Análise por tipo de serviço (Instalação, Tipo 3, Mudança, Empresarial)

### Análise Comparativa
- [x] Comparação com mês anterior (crescimento %)
- [x] Estatísticas por cliente (top 5 clientes)
- [x] Últimos 6 meses de dados

### Compartilhamento
- [x] Salvar em Downloads/Documentos
- [x] Abrir compartilhamento automático (WhatsApp, Email)
- [x] Mostrar mensagem de sucesso
- [x] Logs detalhados para debug


## Atualização v2.0.0 — FINAL COMPLETA (Meta do Mês + Dias Úteis)

### Meta do Mês (Segunda a Sábado)
- [x] Adicionar painel na aba Análise
- [x] Calcular dias úteis restantes (seg-sab, ignorar dom)
- [x] Mostrar: Meta (104), Feitas (X), Faltam (Y)
- [x] Calcular meta por dia: (faltam / diasUteisRestantes)
- [x] Arredondar para cima
- [x] Mostrar: "Você precisa fazer X por dia"

### Estatísticas Detalhadas
- [x] Dias úteis restantes
- [x] Meta por dia
- [x] Hoje fez
- [x] Média diária
- [x] Projeção do mês

### Cálculo de Projeção
- [x] media = feitas / diasUteisPassados
- [x] projecao = media × diasUteisTotais
- [x] Mostrar: "Projeção: 118"

### Dashboard Atualizado
- [x] Card principal com total e valor
- [x] 4 mini-cards (Instalação, Tipo 3, Mudança, Empresarial)
- [x] Painel de meta do mês integrado
- [x] Atualização automática

### Histórico Atualizado
- [x] Mostrar: Cliente, Tipo, Data, Valor
- [x] Empresarial = R$100
- [x] Outros = conforme modo
- [x] Atualizar automático

### Exportações Funcionais
- [x] JSON: arquivo físico, compartilhamento, logs
- [x] CSV: Cliente, Tipo, Data, Valor
- [x] PDF: HTML com resumo, tabela, meta
- [x] Try/catch com erro real

### Atualização Automática
- [x] Cadastrar → atualiza dashboard/histórico
- [x] Editar → atualiza valores
- [x] Excluir → recalcula totais
- [x] Trocar modo → recalcula todos
- [x] Restaurar backup → atualiza tudo
- [x] Sem reiniciar app

### Build Final
- [x] Manter package name
- [x] Incrementar versionCode: 5 → 6
- [x] Incrementar versionName: 1.3.0 → 2.0.0
- [x] Mesma assinatura
- [x] Sem perder dados


## Atualização v3.0.0 — PROFISSIONAL COMPLETA (Meta Personalizável + Dashboard Profissional)

### Meta Personalizável
- [x] Adicionar campo monthlyGoal em Configurações
- [x] Default: 104
- [x] Permitir editar meta mensal
- [x] Salvar em AsyncStorage
- [x] Recalcular automaticamente ao trocar

### Dashboard Profissional Completo
- [x] Total instalações
- [x] Valor total
- [x] Meta mensal (exibir valor configurado)
- [x] Feitas (contador)
- [x] Faltam (contador)
- [x] Meta por dia (cálculo)
- [x] Média atual (feitas / dias trabalhados)
- [x] Média necessária (meta / dias úteis totais)
- [x] Projeção do mês (instalações)
- [x] Projeção valor (R$)
- [x] Hoje: X instalações
- [x] Hoje: R$ X
- [x] Contador por tipo (Instalação, Tipo 3, Mudança, Empresarial)
- [x] Dias trabalhados
- [x] Dias restantes
- [x] Alerta de meta ("Faltam X para meta")

### Instalação Rápida
- [x] Botão "Rápido" no Dashboard
- [x] Criar instalação com: data hoje, tipo padrão, apenas nome
- [x] Feedback imediato
- [x] Atualizar dashboard automaticamente

### Histórico Atualizado
- [x] Mostrar: Cliente, Tipo, Data, Valor
- [x] Empresarial = R$100
- [x] Outros = conforme modo
- [x] Atualizar automático

### Exportações
- [x] JSON: arquivo físico, compartilhamento
- [x] CSV: Cliente, Tipo, Data, Valor
- [x] PDF: resumo, meta, projeção, tabela

### Atualização Automática
- [x] Cadastrar → atualiza dashboard
- [x] Editar → atualiza valores
- [x] Excluir → recalcula totais
- [x] Trocar modo → recalcula todos
- [x] Trocar meta → recalcula todos
- [x] Sem reiniciar app

### Build Final
- [x] Manter package name
- [x] Incrementar versionCode: 6 → 7
- [x] Incrementar versionName: 2.0.0 → 3.0.0
- [x] Mesma assinatura
- [x] Sem perder dados


## Atualização v4.0.0 — PROFISSIONAL AVANÇADA (8 Funcionalidades Premium)

### 1. Gráficos Visuais
- [ ] Gráfico de barras: quantidade por tipo
- [ ] Gráfico de pizza: distribuição de faturamento
- [ ] Gráfico de linha: tendência últimos 6 meses
- [ ] Atualização em tempo real
- [ ] Usar react-native-chart-kit

### 2. Filtros Avançados no Histórico
- [ ] Chips para filtrar por tipo
- [ ] Filtro por data range (de/até)
- [ ] Filtro por valor mín/máx
- [ ] Persistência de filtros
- [ ] Busca combinada (cliente + tipo + data)

### 3. Notificações Inteligentes
- [ ] Alerta ao atingir 104 instalações
- [ ] Resumo diário (total, meta/dia, projeção)
- [ ] Notificação de bônus (R$5 a mais)
- [ ] Lembretes de meta (seg-sab)
- [ ] Usar expo-notifications

### 4. Relatórios Avançados
- [ ] Relatório semanal (seg-dom)
- [ ] Comparativo mensal (este vs anterior)
- [ ] Ranking top 10 clientes
- [ ] Análise de lucratividade por tipo
- [ ] Exportar relatórios

### 5. Sincronização em Nuvem
- [ ] Backup automático diário
- [ ] Sincronizar entre dispositivos
- [ ] Histórico de backups
- [ ] Restauração por data específica
- [ ] Usar backend server

### 6. Modo Escuro Profissional
- [ ] Tema escuro otimizado
- [ ] Transição suave entre temas
- [ ] Persistência de preferência
- [ ] Cores profissionais

### 7. Integração com Calendário
- [ ] Visualizar instalações no calendário
- [ ] Marcar datas importantes
- [ ] Sincronizar com Google Calendar (opcional)
- [ ] Cores por tipo de serviço

### 8. Análise de Produtividade
- [ ] Dias mais produtivos (gráfico)
- [ ] Horário de pico
- [ ] Tempo médio entre instalações
- [ ] Estatísticas por dia da semana
- [ ] Comparativo de produtividade


## Atualização v4.9.0 — Notificações de Alerta de Meta

### Notificações Visuais
- [x] Criar componente Toast reutilizável
- [x] Implementar lógica de detecção de milestones (50%, 75%, 90%)
- [x] Adicionar notificações ao Dashboard (index.tsx)
- [x] Adicionar notificações ao Dashboard Profissional (dashboard-pro.tsx)
- [x] Adicionar badges visuais aos cards de meta
- [x] Testar e validar notificações em todos os cenários


## Atualização v5.0.0 — Exibição de Faltam + Bairros

### Exibição de Faltam (VALOR + QUANTIDADE)
- [x] Atualizar Dashboard (index.tsx) para exibir "Faltam R$ XXX e X instalações"
- [ ] Atualizar Dashboard Profissional (dashboard-pro.tsx)
- [ ] Atualizar Análise (analise.tsx)

### Picker de Bairros de Luís Eduardo Magalhães
- [x] Criar lista de bairros (lib/bairros-lem.ts)
- [x] Remover campo de endereço e substituir por bairro
- [x] Implementar picker de bairro na tela de adicionar instalação
- [x] Testar integração com formulário


## Atualização v5.2.0 — Remover Funcionalidade de Editar Instalação

### Remoção de Editar Instalação
- [x] Remover estados de edição do historico.tsx
- [x] Remover Modal de edição
- [x] Remover botão de editar do card
- [x] Remover função abrirEdicao
- [x] Manter funcionalidade de duplicar e excluir

## Atualização v5.1.0 — Dashboard Profissional, Filtro por Bairro e Relatório

### Exibição de Faltam nas Outras Abas
- [x] Atualizar Dashboard Profissional (dashboard-pro.tsx) para exibir "Faltam R$ XXX e X instalações"
- [x] Atualizar Análise (analise.tsx) para exibir "Faltam R$ XXX e X instalações"

### Filtro por Bairro
- [x] Criar contexto de filtro (BairroFilterContext.tsx)
- [x] Criar componente BairroFilter reutilizável
- [x] Adicionar picker de bairro ao Dashboard (index.tsx)
- [x] Adicionar picker de bairro ao Dashboard Profissional (dashboard-pro.tsx)
- [x] Adicionar picker de bairro ao Calendário (calendario.tsx)
- [x] Filtrar dados exibidos baseado no bairro selecionado

### Relatório por Bairro
- [x] Criar nova tela de relatório por bairro (relatorio-bairro.tsx)
- [x] Exibir faturamento total por bairro
- [x] Exibir quantidade de instalações por bairro
- [x] Exibir produtividade (valor/dia) por bairro
- [x] Adicionar opção de ordenação por valor ou quantidade
- [x] Adicionar breakdown por tipo de serviço por bairro


## Atualização v5.3.0 — Importar Dados em Lote (CSV/Excel)

### Funcionalidade de Importação
- [x] Criar componente de seletor de arquivo (DocumentPicker)
- [x] Implementar parser de CSV/Excel
- [x] Adicionar validação de dados importados
- [x] Criar modal de importação com preview
- [x] Integrar importação na tela de Novo Cadastro
- [x] Testar e validar importação com arquivos reais


## Atualização v5.5.0 — Seleção de Pasta para Exportação

### Seleção de Pasta
- [x] Criar função selecionarPastaParaExportacao()
- [x] Criar função exportarCSVParaPasta()
- [x] Criar função exportarBackupParaPasta()
- [x] Atualizar botões para usar seleção de pasta
- [x] Testar seleção e exportação

## Atualização v5.4.0 — Correção de Exportação

### Correção de Exportação CSV/JSON
- [x] Adicionar permissões de arquivo ao app.config.ts (READ/WRITE/MANAGE_EXTERNAL_STORAGE)
- [x] Adicionar try-catch para compartilhamento com fallback
- [x] Corrigir exportarCSV com tratamento de erro melhorado
- [x] Corrigir exportarBackup com tratamento de erro melhorado
- [x] Testar exportação em dispositivo Android
