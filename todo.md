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
