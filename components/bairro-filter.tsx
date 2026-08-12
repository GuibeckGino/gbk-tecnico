import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { BAIRROS_LEM, buscarBairros } from '@/lib/bairros-lem';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface BairroFilterProps {
  bairroSelecionado: string | null;
  onSelectBairro: (bairro: string | null) => void;
}

export function BairroFilter({ bairroSelecionado, onSelectBairro }: BairroFilterProps) {
  const colors = useColors();
  const [mostrarLista, setMostrarLista] = useState(false);
  const [busca, setBusca] = useState('');
  const bairrosFiltrados = busca.trim() ? buscarBairros(busca) : BAIRROS_LEM;

  const handleSelectBairro = (bairro: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectBairro(bairro);
    setMostrarLista(false);
    setBusca('');
  };

  const handleLimpar = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectBairro(null);
    setBusca('');
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.botao,
          {
            backgroundColor: '#0B1426',
            borderColor: '#C99524',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            justifyContent: 'space-between',
          },
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => setMostrarLista(!mostrarLista)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <IconSymbol name="location.fill" size={22} color={colors.primary} />
          <Text
            style={{
              color: '#F8FAFC',
              fontSize: 15,
              fontWeight: '600',
              marginLeft: 12,
            }}
            numberOfLines={1}
          >
            {bairroSelecionado || 'Todos os bairros'}
          </Text>
        </View>
        <IconSymbol name="chevron.down" size={24} color={colors.muted} />
      </Pressable>

      {bairroSelecionado && (
        <Pressable
          style={({ pressed }) => [
            styles.botaoLimpar,
            { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleLimpar}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>✕</Text>
        </Pressable>
      )}

      {mostrarLista && (
        <View
          style={[
            styles.lista,
            {
              backgroundColor: '#0B1426',
              borderColor: '#C99524',
            },
          ]}
        >
          <TextInput
            style={[
              styles.busca,
              {
                backgroundColor: '#050A14',
                borderColor: '#1E2A3F',
                color: '#F8FAFC',
              },
            ]}
            placeholder="Buscar bairro..."
            placeholderTextColor={colors.muted}
            value={busca}
            onChangeText={setBusca}
          />
          <ScrollView style={styles.scrollView}>
            {bairrosFiltrados.map((bairro) => (
              <Pressable
                key={bairro}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor:
                      bairroSelecionado === bairro ? colors.primary : 'transparent',
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleSelectBairro(bairro)}
              >
                <Text
                  style={{
                    color: bairroSelecionado === bairro ? '#fff' : '#F8FAFC',
                    fontSize: 14,
                  }}
                >
                  {bairro}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  botaoLimpar: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
  },
  busca: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    fontSize: 14,
  },
  scrollView: {
    maxHeight: 200,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
});
