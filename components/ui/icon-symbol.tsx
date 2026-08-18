// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = string;

// Adicionar novo tipo para suportar ícones adicionais
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navegação padrão
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "location.fill": "location-on",
  "chevron.down": "expand-more",
  "build.fill": "build",
  "square.stack.3d.up.fill": "layers",
  "arrow.triangle.2.circlepath": "sync",
  "building.2.fill": "business",
  "target": "track-changes",
  "clock.fill": "schedule",
  "check-circle": "check-circle",
  "trending-up": "trending-up",
  // GBK Técnico
  "chart.bar.fill": "bar-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "plus.circle.fill": "add-circle",
  "list.bullet": "list",
  "gearshape.fill": "settings",
  "dollarsign.circle.fill": "attach-money",
  "map.fill": "map",
  "chart.pie.fill": "pie-chart",
  "magnifyingglass": "search",
  "calendar": "calendar-today",
  "eye.fill": "visibility",
  "star.fill": "star",
  "star": "star-border",
  "doc.on.clipboard": "content-copy",
  "doc.text.fill": "description",
  "trash.fill": "delete-outline",
  "line.3.horizontal.decrease.circle": "filter-list",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialIcon = MAPPING[name as keyof typeof MAPPING] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={materialIcon} style={style} />;
}
