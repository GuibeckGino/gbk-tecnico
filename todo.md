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
