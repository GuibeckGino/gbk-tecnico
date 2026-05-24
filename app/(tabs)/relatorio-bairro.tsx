import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useColors } from '@/hooks/use-colors';
import { useMonth } from '@/context/MonthContext';
import { calcularValorPorTipo, calcularStats } from '@/types/installation';
import { BAIRROS_LEM } from '@/lib/bairros-lem';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface BairroStats {
  bairro: string;
  total: number;
  valor: number;
  porTipo: { [key: string]: number };
  produtividade: number; // valor por dia
}

export default function RelatorioBairroScreen() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const colors = useColors();
  const [ordenacao, setOrdenacao] = useState<'valor' | 'quantidade'>('valor');

  // Calcular stats por bairro
  const statsPorBairro = useMemo(() => {
    const stats: BairroStats[] = [];

    BAIRROS_LEM.forEach((bairro) => {
      const instalacoesDoMes = instalacoes.filter((inst) => {
        const [d, m, a] = inst.data.split('/');
        return parseInt(m) === mes + 1 && parseInt(a) === ano && inst.endereco === bairro;
      });

      if (instalacoesDoMes.length === 0) return;

      const statsCalc = calcularStats(instalacoesDoMes, paymentMode);
      const porTipo: { [key: string]: number } = {
        'Instalação': 0,
        'Tipo 3': 0,
        'Mudança': 0,
        'Empresarial': 0,
      };

      instalacoesDoMes.forEach((inst) => {
        porTipo[inst.tipoServico] = (porTipo[inst.tipoServico] || 0) + 1;
      });

      // Calcular dias únicos com instalações
      const diasComInstalacao = new Set(
        instalacoesDoMes.map((inst) => inst.data)
      ).size;

      const produtividade = diasComInstalacao > 0 ? statsCalc.valorTotal / diasComInstalacao : 0;

      stats.push({
        bairro,
        total: instalacoesDoMes.length,
        valor: statsCalc.valorTotal,
        porTipo,
        produtividade,
      });
    });

    // Ordenar por valor ou quantidade
    return stats.sort((a, b) => {
      if (ordenacao === 'valor') {
        return b.valor - a.valor;
      } else {
        return b.total - a.total;
      }
    });
  }, [instalacoes, mes, ano, paymentMode, ordenacao]);

  // Totais gerais
  const totaisGerais = useMemo(() => {
    let totalValor = 0;
    let totalInstalacoes = 0;

    statsPorBairro.forEach((stats) => {
      totalValor += stats.valor;
      totalInstalacoes += stats.total;
    });

    return { totalValor, totalInstalacoes };
  }, [statsPorBairro]);

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo Header */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 60, height: 60, borderRadius: 12 }}
          />
        </View>

        {/* Cabeçalho */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={[styles.titulo, { color: colors.foreground }]}>
            Relatório por Bairro
          </Text>
          <Text style={[styles.subtitulo, { color: colors.muted }]}>
            {nomesMes[mes]} de {ano}
          </Text>
        </View>

        {/* Card de Totais */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={[styles.cardTotais, { backgroundColor: colors.primary }]}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Total Faturado
              </Text>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 4 }}>
                R$ {totaisGerais.totalValor.toLocaleString('pt-BR')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Instalações
              </Text>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 4 }}>
                {totaisGerais.totalInstalacoes}
              </Text>
            </View>
          </View>
        </View>

        {/* Botões de Ordenação */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              handleHaptic();
              setOrdenacao('valor');
            }}
            style={[
              styles.botaoOrdenacao,
              {
                backgroundColor: ordenacao === 'valor' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: ordenacao === 'valor' ? '#fff' : colors.foreground,
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              Por Valor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              handleHaptic();
              setOrdenacao('quantidade');
            }}
            style={[
              styles.botaoOrdenacao,
              {
                backgroundColor: ordenacao === 'quantidade' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: ordenacao === 'quantidade' ? '#fff' : colors.foreground,
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              Por Quantidade
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Bairros */}
        <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 20 }}>
          {statsPorBairro.length === 0 ? (
            <View style={[styles.cardVazio, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 14 }}>
                Nenhuma instalação registrada neste período
              </Text>
            </View>
          ) : (
            statsPorBairro.map((stats, idx) => (
              <View
                key={stats.bairro}
                style={[
                  styles.cardBairro,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Cabeçalho do Card */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>
                      {idx + 1}. {stats.bairro}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {stats.total} instalação{stats.total !== 1 ? 'ões' : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                      R$ {stats.valor.toLocaleString('pt-BR')}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                      R$ {stats.produtividade.toLocaleString('pt-BR')}/dia
                    </Text>
                  </View>
                </View>

                {/* Breakdown por Tipo */}
                <View style={[styles.breakdown, { borderTopColor: colors.border }]}>
                  {Object.entries(stats.porTipo).map(([tipo, qtd]) => {
                    if (qtd === 0) return null;
                    return (
                      <View key={tipo} style={styles.tipoRow}>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>{tipo}</Text>
                        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 12 }}>
                          {qtd}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: 14,
    marginTop: 4,
  },
  cardTotais: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
  },
  botaoOrdenacao: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardVazio: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardBairro: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  breakdown: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 6,
  },
  tipoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
