import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { BAIRROS_LEM, buscarBairros } from '@/lib/bairros-lem';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

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
            backgroundColor: bairroSelecionado ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => setMostrarLista(!mostrarLista)}
      >
        <Text
          style={{
            color: bairroSelecionado ? '#fff' : colors.foreground,
            fontSize: 14,
            fontWeight: '500',
          }}
        >
          {bairroSelecionado ? `📍 ${bairroSelecionado}` : 'Todos os bairros'}
        </Text>
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
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.busca,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
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
                    color: bairroSelecionado === bairro ? '#fff' : colors.foreground,
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
