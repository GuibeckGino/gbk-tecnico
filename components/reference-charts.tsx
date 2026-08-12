import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

const BLUE = '#2F7BFF';
const BLUE_DARK = '#0D3FAE';
const CYAN = '#16A6C7';
const GOLD = '#F2B52B';
const GRID = '#2A394F';
const MUTED = '#AAB4C4';
const SURFACE = '#0B1426';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatMoney(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ReferenceBarChart({
  labels,
  values,
  width,
  onValuePress,
}: {
  labels: string[];
  values: number[];
  width: number;
  onValuePress?: (label: string, value: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const height = 272;
  const left = 44;
  const right = 10;
  const top = 20;
  const bottom = 54;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(40, Math.ceil(Math.max(...values, 0) / 10) * 10);
  const ticks = [0, 1, 2, 3, 4].map((index) => (maxValue / 4) * index);
  const slot = chartWidth / Math.max(labels.length, 1);
  const barWidth = Math.min(48, slot * 0.42);

  return (
    <View style={{ width, alignSelf: 'center' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2679FF" />
            <Stop offset="1" stopColor="#0B3EA7" />
          </LinearGradient>
        </Defs>
        {ticks.map((tick, index) => {
          const y = top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <G key={`tick-${index}`}>
              <Line x1={left} y1={y} x2={width - right} y2={y} stroke={GRID} strokeWidth={1} strokeDasharray="6 6" />
              <SvgText x={left - 12} y={y + 5} fill={MUTED} fontSize="16" textAnchor="end">{Math.round(tick)}</SvgText>
            </G>
          );
        })}
        <Line x1={left} y1={top + chartHeight} x2={width - right} y2={top + chartHeight} stroke="#758197" strokeWidth={1} />
        {values.map((value, index) => {
          const barHeight = (clamp(value, 0, maxValue) / maxValue) * chartHeight;
          const x = left + slot * index + (slot - barWidth) / 2;
          const y = top + chartHeight - barHeight;
          const label = labels[index];
          return (
            <G key={label}>
              {value > 0 ? <Rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill="url(#barGradient)" /> : null}
              <SvgText x={x + barWidth / 2} y={value > 0 ? y - 10 : top + chartHeight - 10} fill={BLUE} fontSize="18" fontWeight="700" textAnchor="middle">{value}</SvgText>
              <SvgText x={x + barWidth / 2} y={height - 15} fill={BLUE} fontSize="16" textAnchor="middle">{label}</SvgText>
            </G>
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', left, right, top, height: chartHeight + 28, flexDirection: 'row' }}>
        {labels.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => {
              setSelected(index);
              onValuePress?.(label, values[index]);
            }}
            style={{ flex: 1, alignItems: 'center' }}
          />
        ))}
      </View>
      {selected !== null ? (
        <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: SURFACE, borderColor: BLUE, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{labels[selected]}</Text>
          <Text style={{ color: BLUE, marginTop: 2 }}>{values[selected]} instalações</Text>
          <Pressable onPress={() => setSelected(null)}><Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Fechar</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

function donutSegmentPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const outerStart = [cx + outer * Math.cos(start), cy + outer * Math.sin(start)];
  const outerEnd = [cx + outer * Math.cos(end), cy + outer * Math.sin(end)];
  const innerEnd = [cx + inner * Math.cos(end), cy + inner * Math.sin(end)];
  const innerStart = [cx + inner * Math.cos(start), cy + inner * Math.sin(start)];
  return `M ${outerStart[0]} ${outerStart[1]} A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd[0]} ${outerEnd[1]} L ${innerEnd[0]} ${innerEnd[1]} A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart[0]} ${innerStart[1]} Z`;
}

export function ReferenceSemiDonut({
  items,
  total,
  width,
}: {
  items: Array<{ name: string; value: number; color: string; quantity: number }>;
  total: number;
  width: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const chartWidth = Math.min(width * 0.56, 430);
  const height = 230;
  const cx = chartWidth / 2;
  const cy = 146;
  const outer = Math.min(108, chartWidth / 2 - 10);
  const inner = outer * 0.54;
  const nonZero = items.filter((item) => item.value > 0);
  const effectiveItems = nonZero.length > 0 ? nonZero : items;
  const effectiveTotal = effectiveItems.reduce((sum, item) => sum + item.value, 0);
  let cursor = Math.PI;

  const segments = effectiveItems.map((item) => {
    const portion = effectiveTotal > 0 ? item.value / effectiveTotal : 1 / Math.max(effectiveItems.length, 1);
    const start = cursor;
    const end = cursor + portion * Math.PI;
    cursor = end;
    return { ...item, start, end, percentage: portion * 100 };
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 250 }}>
      <View style={{ flex: 1, paddingRight: 6 }}>
        {segments.map((item, index) => (
          <Pressable key={item.name} onPress={() => setSelected(index)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 7 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: item.color, marginRight: 12 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 16, flex: 1 }}>{Math.round(item.percentage)}% {item.name}</Text>
          </Pressable>
        ))}
        {selected !== null ? (
          <View style={{ backgroundColor: SURFACE, borderColor: BLUE, borderWidth: 1, borderRadius: 10, padding: 9, marginTop: 8 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{segments[selected].name}</Text>
            <Text style={{ color: BLUE, marginTop: 2 }}>{formatMoney(segments[selected].value)}</Text>
            <Text style={{ color: MUTED, fontSize: 12 }}>{segments[selected].quantity} instalações</Text>
            <Pressable onPress={() => setSelected(null)}><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Fechar</Text></Pressable>
          </View>
        ) : null}
      </View>
      <View style={{ width: chartWidth, alignItems: 'center' }}>
        <Svg width={chartWidth} height={height}>
          {segments.map((item) => (
            <Path key={item.name} d={donutSegmentPath(cx, cy, outer, inner, item.start, item.end)} fill={item.color} />
          ))}
          <SvgText x={cx} y={cy - 3} fill={MUTED} fontSize="16" textAnchor="middle">Total</SvgText>
          <SvgText x={cx} y={cy + 25} fill={GOLD} fontSize="23" fontWeight="700" textAnchor="middle">{formatMoney(total)}</SvgText>
        </Svg>
      </View>
    </View>
  );
}

export function ReferenceLineChart({
  labels,
  values,
  width,
}: {
  labels: string[];
  values: number[];
  width: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const height = 270;
  const left = 42;
  const right = 12;
  const top = 22;
  const bottom = 48;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(100, Math.ceil(Math.max(...values, 0) / 25) * 25);
  const points = values.map((value, index) => {
    const x = left + (chartWidth * index) / Math.max(values.length - 1, 1);
    const y = top + chartHeight - (clamp(value, 0, maxValue) / maxValue) * chartHeight;
    return { x, y, value };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <View style={{ width, alignSelf: 'center' }}>
      <Svg width={width} height={height}>
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <G key={tick}>
              <Line x1={left} y1={y} x2={width - right} y2={y} stroke={GRID} strokeWidth={1} strokeDasharray="6 6" />
              <SvgText x={left - 10} y={y + 5} fill={MUTED} fontSize="15" textAnchor="end">{tick}</SvgText>
            </G>
          );
        })}
        <Line x1={left} y1={top + chartHeight} x2={width - right} y2={top + chartHeight} stroke="#758197" strokeWidth={1} />
        <Path d={path} fill="none" stroke={BLUE} strokeWidth={3} />
        {points.map((point, index) => (
          <G key={labels[index]}>
            <Circle cx={point.x} cy={point.y} r={7} fill={BLUE} />
            <SvgText x={point.x} y={point.y - 14} fill="#F0F4FA" fontSize="15" textAnchor="middle">{point.value}</SvgText>
            <SvgText x={point.x} y={height - 14} fill={index === labels.length - 1 ? BLUE : MUTED} fontSize="16" textAnchor="middle">{labels[index]}</SvgText>
          </G>
        ))}
      </Svg>
      <View style={{ position: 'absolute', left, top: 0, width: chartWidth, height: top + chartHeight + 24, flexDirection: 'row' }}>
        {labels.map((label, index) => (
          <Pressable key={label} onPress={() => setSelected(index)} style={{ flex: 1 }} />
        ))}
      </View>
      {selected !== null ? (
        <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: SURFACE, borderColor: BLUE, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{labels[selected]}</Text>
          <Text style={{ color: BLUE, marginTop: 2 }}>{values[selected]} instalações</Text>
          <Pressable onPress={() => setSelected(null)}><Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Fechar</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}
