import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F2B52B',
        tabBarInactiveTintColor: '#B8C1D1',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: '#070C16',
          borderTopColor: '#1E2A3F',
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="novo-cadastro"
        options={{
          title: "Novo",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="plus.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="graficos"
        options={{
          title: "Gráficos",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.pie.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analise"
        options={{
          title: "Análise",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendário",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meu-veiculo"
        options={{
          title: "Veículo",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="car.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: "Config",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
