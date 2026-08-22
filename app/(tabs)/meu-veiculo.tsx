import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BarChart } from "react-native-chart-kit";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PREMIUM, PremiumCard, PremiumHeader } from "@/components/premium-ui";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth } from "@/context/MonthContext";
import { useVehicle } from "@/context/VehicleContext";
import { obterDataAtual } from "@/lib/input-masks";
import { obterPrecosCustomizadosDoMes } from "@/lib/monthly-payment-mode";
import { calcularStats, type CustomPrices } from "@/types/installation";
import {
  calculateFuelMetrics,
  calculateVehicleMonthlySummary,
  calculateVehiclePeriodSummary,
  getScheduledMaintenanceStatus,
  type FuelRecord,
  type MaintenanceCategory,
  type MaintenanceRecord,
  type ScheduledMaintenance,
  type VehicleProfile,
} from "@/types/vehicle";

type Tab = "resumo" | "abastecimentos" | "manutencao" | "planejado";
type ModalKind = "perfil" | "combustivel" | "manutencao" | "planejado" | "custos" | null;
type PeriodPreset = "mes" | "trimestre" | "semestre" | "ano" | "personalizado";
type ChartMetric = "custo" | "combustivel" | "manutencao" | "km" | "custoKm" | "consumo" | "custoOs";

const CATEGORIES: MaintenanceCategory[] = [
  "óleo", "filtros", "pneus", "freios", "suspensão", "motor", "ar-condicionado",
  "elétrica", "alinhamento/balanceamento", "documentação", "seguro", "lavagem", "outros",
];

const screenWidth = Dimensions.get("window").width;
const chartWidth = Math.max(260, screenWidth - 68);

function money(value?: number) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function decimal(value?: number, suffix = "") {
  return value === undefined || !Number.isFinite(value) ? "—" : `${value.toFixed(2).replace(".", ",")}${suffix}`;
}

function km(value?: number) {
  return value === undefined ? "—" : `${value.toLocaleString("pt-BR")} km`;
}

function asNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthLabel(month: number) {
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][month];
}

const EMPTY_PROFILE: VehicleProfile = { status: "ativo" };

export default function MeuVeiculoScreen() {
  const { mes, ano, mesAnoFormatado } = useMonth();
  const { instalacoes, paymentMode, carregarConfiguracoesDoMes } = useInstallations();
  const {
    vehicleData,
    isVehicleLoading,
    updateProfile,
    updateOperationalCosts,
    addFuelRecord,
    updateFuelRecord,
    removeFuelRecord,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    removeMaintenanceRecord,
    addScheduledMaintenance,
    updateScheduledMaintenance,
    removeScheduledMaintenance,
  } = useVehicle();
  const [activeTab, setActiveTab] = useState<Tab>("resumo");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("mes");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("custo");
  const [customStart, setCustomStart] = useState(`01/${String(mes + 1).padStart(2, "0")}/${ano}`);
  const [customEnd, setCustomEnd] = useState(`${String(new Date(ano, mes + 1, 0).getDate()).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [customPrices, setCustomPrices] = useState<CustomPrices | undefined>();
  const [editingFuel, setEditingFuel] = useState<FuelRecord | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledMaintenance | null>(null);
  const [profileForm, setProfileForm] = useState({ ...EMPTY_PROFILE });
  const [fuelForm, setFuelForm] = useState({ data: obterDataAtual(), quilometragem: "", litros: "", precoPorLitro: "", combustivel: "", posto: "", observacoes: "" });
  const [maintenanceForm, setMaintenanceForm] = useState({ data: obterDataAtual(), quilometragem: "", categoria: "óleo" as MaintenanceCategory, descricao: "", valor: "", oficina: "", observacoes: "" });
  const [scheduledForm, setScheduledForm] = useState({ titulo: "", categoria: "óleo" as MaintenanceCategory, proximaKm: "", proximaData: "", observacoes: "" });

  useEffect(() => {
    void carregarConfiguracoesDoMes(mes, ano);
    void obterPrecosCustomizadosDoMes(mes, ano).then(setCustomPrices);
  }, [ano, carregarConfiguracoesDoMes, mes]);

  const monthInstallations = useMemo(() => instalacoes.filter((item) => {
    const [, itemMonth, itemYear] = item.data.split("/").map(Number);
    return itemMonth === mes + 1 && itemYear === ano;
  }), [ano, instalacoes, mes]);

  const summary = useMemo(
    () => calculateVehicleMonthlySummary(vehicleData, instalacoes, mes, ano),
    [ano, instalacoes, mes, vehicleData],
  );
  const periodRange = useMemo(() => {
    const lastDay = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    if (periodPreset === "mes") return { start: `01/${String(mes + 1).padStart(2, "0")}/${ano}`, end: `${String(lastDay(mes, ano)).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`, label: mesAnoFormatado };
    if (periodPreset === "trimestre") {
      const startMonth = Math.floor(mes / 3) * 3;
      const endMonth = startMonth + 2;
      return { start: `01/${String(startMonth + 1).padStart(2, "0")}/${ano}`, end: `${String(lastDay(endMonth, ano)).padStart(2, "0")}/${String(endMonth + 1).padStart(2, "0")}/${ano}`, label: `${monthLabel(startMonth)}–${monthLabel(endMonth)} ${ano}` };
    }
    if (periodPreset === "semestre") {
      const startMonth = mes < 6 ? 0 : 6;
      const endMonth = startMonth + 5;
      return { start: `01/${String(startMonth + 1).padStart(2, "0")}/${ano}`, end: `${String(lastDay(endMonth, ano)).padStart(2, "0")}/${String(endMonth + 1).padStart(2, "0")}/${ano}`, label: `${startMonth === 0 ? "1º" : "2º"} semestre de ${ano}` };
    }
    if (periodPreset === "ano") return { start: `01/01/${ano}`, end: `31/12/${ano}`, label: `Ano de ${ano}` };
    return { start: customStart, end: customEnd, label: "Período personalizado" };
  }, [ano, customEnd, customStart, mes, mesAnoFormatado, periodPreset]);
  const periodSummary = useMemo(
    () => calculateVehiclePeriodSummary(vehicleData, instalacoes, periodRange.start, periodRange.end),
    [instalacoes, periodRange.end, periodRange.start, vehicleData],
  );
  const displayedSummary = periodPreset === "mes" ? summary : periodSummary;
  const monthRevenue = useMemo(
    () => calcularStats(monthInstallations, paymentMode, customPrices).valorTotal,
    [customPrices, monthInstallations, paymentMode],
  );
  const costShare = periodPreset === "mes" && monthRevenue > 0 ? (summary.totalCost / monthRevenue) * 100 : undefined;
  const fuelMetrics = useMemo(() => calculateFuelMetrics(vehicleData.fuelRecords), [vehicleData.fuelRecords]);
  const costSeries = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(ano, mes - (5 - index), 1);
    const item = calculateVehicleMonthlySummary(vehicleData, instalacoes, date.getMonth(), date.getFullYear());
    return { label: monthLabel(date.getMonth()), value: item.totalCost };
  }), [ano, instalacoes, mes, vehicleData]);
  const chartSeries = useMemo(() => costSeries.map((item, index) => {
    const date = new Date(ano, mes - (5 - index), 1);
    const monthly = calculateVehicleMonthlySummary(vehicleData, instalacoes, date.getMonth(), date.getFullYear());
    const values: Record<ChartMetric, number> = {
      custo: monthly.totalCost,
      combustivel: monthly.fuelCost,
      manutencao: monthly.maintenanceCost,
      km: monthly.kmDriven,
      custoKm: monthly.operationalCostPerKm ?? 0,
      consumo: monthly.consumptionKmPerLiter ?? 0,
      custoOs: monthly.vehicleCostPerOs ?? 0,
    };
    return { label: item.label, value: values[chartMetric] };
  }), [ano, chartMetric, costSeries, instalacoes, mes, vehicleData]);
  const previousSummary = useMemo(() => {
    const previous = new Date(ano, mes - 1, 1);
    return calculateVehicleMonthlySummary(vehicleData, instalacoes, previous.getMonth(), previous.getFullYear());
  }, [ano, instalacoes, mes, vehicleData]);
  const costPerKmVariation = summary.operationalCostPerKm && previousSummary.operationalCostPerKm
    ? ((summary.operationalCostPerKm - previousSummary.operationalCostPerKm) / previousSummary.operationalCostPerKm) * 100
    : undefined;

  const openProfile = () => {
    setProfileForm({ ...EMPTY_PROFILE, ...vehicleData.profile });
    setModalKind("perfil");
  };
  const openFuel = (record?: FuelRecord) => {
    setEditingFuel(record ?? null);
    setFuelForm(record ? {
      data: record.data, quilometragem: String(record.quilometragem), litros: String(record.litros), precoPorLitro: String(record.precoPorLitro),
      combustivel: record.combustivel ?? "", posto: record.posto ?? "", observacoes: record.observacoes ?? "",
    } : {
      data: obterDataAtual(), quilometragem: vehicleData.profile.kmAtual ? String(vehicleData.profile.kmAtual) : "", litros: "",
      precoPorLitro: vehicleData.profile.precoMedioCombustivel ? String(vehicleData.profile.precoMedioCombustivel) : "", combustivel: vehicleData.profile.combustivel ?? "", posto: "", observacoes: "",
    });
    setModalKind("combustivel");
  };
  const openMaintenance = (record?: MaintenanceRecord) => {
    setEditingMaintenance(record ?? null);
    setMaintenanceForm(record ? {
      data: record.data, quilometragem: record.quilometragem ? String(record.quilometragem) : "", categoria: record.categoria,
      descricao: record.descricao, valor: String(record.valor), oficina: record.oficina ?? "", observacoes: record.observacoes ?? "",
    } : { data: obterDataAtual(), quilometragem: vehicleData.profile.kmAtual ? String(vehicleData.profile.kmAtual) : "", categoria: "óleo", descricao: "", valor: "", oficina: "", observacoes: "" });
    setModalKind("manutencao");
  };
  const openScheduled = (record?: ScheduledMaintenance) => {
    setEditingScheduled(record ?? null);
    setScheduledForm(record ? {
      titulo: record.titulo, categoria: record.categoria, proximaKm: record.proximaKm ? String(record.proximaKm) : "", proximaData: record.proximaData ?? "", observacoes: record.observacoes ?? "",
    } : { titulo: "", categoria: "óleo", proximaKm: "", proximaData: "", observacoes: "" });
    setModalKind("planejado");
  };

  const saveProfile = () => {
    updateProfile({
      ...profileForm,
      capacidadeTanque: profileForm.capacidadeTanque ? Number(profileForm.capacidadeTanque) : undefined,
      kmInicial: profileForm.kmInicial ? Number(profileForm.kmInicial) : undefined,
      kmAtual: profileForm.kmAtual ? Number(profileForm.kmAtual) : undefined,
      consumoEsperado: profileForm.consumoEsperado ? Number(profileForm.consumoEsperado) : undefined,
      precoMedioCombustivel: profileForm.precoMedioCombustivel ? Number(profileForm.precoMedioCombustivel) : undefined,
    });
    setModalKind(null);
  };
  const saveFuel = () => {
    const quilometragem = asNumber(fuelForm.quilometragem);
    const litros = asNumber(fuelForm.litros);
    const precoPorLitro = asNumber(fuelForm.precoPorLitro);
    if (!fuelForm.data || quilometragem <= 0 || litros <= 0 || precoPorLitro <= 0) {
      Alert.alert("Dados incompletos", "Informe data, quilometragem, litros e preço por litro.");
      return;
    }
    const base = { data: fuelForm.data, quilometragem, litros, precoPorLitro, combustivel: fuelForm.combustivel, posto: fuelForm.posto, observacoes: fuelForm.observacoes };
    if (editingFuel) updateFuelRecord({ ...editingFuel, ...base, valorTotal: Number((litros * precoPorLitro).toFixed(2)) });
    else addFuelRecord(base);
    setModalKind(null);
  };
  const saveMaintenance = () => {
    const valor = asNumber(maintenanceForm.valor);
    if (!maintenanceForm.data || !maintenanceForm.descricao.trim() || valor <= 0) {
      Alert.alert("Dados incompletos", "Informe data, descrição e valor da manutenção.");
      return;
    }
    const base = { data: maintenanceForm.data, quilometragem: maintenanceForm.quilometragem ? asNumber(maintenanceForm.quilometragem) : undefined, categoria: maintenanceForm.categoria, descricao: maintenanceForm.descricao.trim(), valor, oficina: maintenanceForm.oficina, observacoes: maintenanceForm.observacoes };
    if (editingMaintenance) updateMaintenanceRecord({ ...editingMaintenance, ...base });
    else addMaintenanceRecord(base);
    setModalKind(null);
  };
  const saveScheduled = () => {
    if (!scheduledForm.titulo.trim()) {
      Alert.alert("Título obrigatório", "Informe qual manutenção deve ser acompanhada.");
      return;
    }
    const base = { titulo: scheduledForm.titulo.trim(), categoria: scheduledForm.categoria, proximaKm: scheduledForm.proximaKm ? asNumber(scheduledForm.proximaKm) : undefined, proximaData: scheduledForm.proximaData || undefined, observacoes: scheduledForm.observacoes };
    if (!base.proximaKm && !base.proximaData) {
      Alert.alert("Defina uma referência", "Informe a próxima quilometragem ou uma data de vencimento.");
      return;
    }
    if (editingScheduled) updateScheduledMaintenance({ ...editingScheduled, ...base });
    else addScheduledMaintenance(base);
    setModalKind(null);
  };

  const confirmDelete = (label: string, onConfirm: () => void) => {
    Alert.alert("Excluir registro", `Deseja excluir ${label}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: onConfirm },
    ]);
  };

  if (isVehicleLoading) {
    return <ScreenContainer><View style={styles.loading}><Text style={styles.muted}>Carregando dados do veículo…</Text></View></ScreenContainer>;
  }

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <View style={styles.headerShell}>
        <PremiumHeader title="Meu Veículo" subtitle={mesAnoFormatado} icon="car.fill" />
        <Pressable style={styles.headerAction} onPress={openProfile}>
          <MaterialIcons name="directions-car" size={21} color="#FFFFFF" />
          <Text style={styles.headerActionText}>{vehicleData.profile.modelo ? "Editar" : "Cadastrar"}</Text>
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {([
          ["resumo", "Resumo", "dashboard"],
          ["abastecimentos", "Abastecimentos", "local-gas-station"],
          ["manutencao", "Manutenção", "build"],
          ["planejado", "Planejado", "event-available"],
        ] as Array<[Tab, string, React.ComponentProps<typeof MaterialIcons>["name"]]>).map(([key, label, icon]) => (
          <Pressable key={key} onPress={() => setActiveTab(key)} style={[styles.tabButton, activeTab === key && styles.tabButtonActive]}>
            <MaterialIcons name={icon} size={18} color={activeTab === key ? "#FFFFFF" : PREMIUM.muted} />
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "resumo" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.periodCard}>
            <Text style={styles.periodLabel}>RELATÓRIO DO VEÍCULO · {periodRange.label.toUpperCase()}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodChips}>
              {(["mes", "trimestre", "semestre", "ano", "personalizado"] as PeriodPreset[]).map((preset) => (
                <Pressable key={preset} onPress={() => setPeriodPreset(preset)} style={[styles.periodChip, periodPreset === preset && styles.periodChipActive]}>
                  <Text style={[styles.periodChipText, periodPreset === preset && styles.periodChipTextActive]}>{preset === "mes" ? "Mês" : preset === "trimestre" ? "Trimestre" : preset === "semestre" ? "Semestre" : preset === "ano" ? "Ano" : "Personalizado"}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {periodPreset === "personalizado" ? <View style={styles.customPeriodRow}><TextInput value={customStart} onChangeText={setCustomStart} placeholder="dd/mm/aaaa" placeholderTextColor="#75839B" style={styles.customPeriodInput} /><Text style={styles.customPeriodSeparator}>até</Text><TextInput value={customEnd} onChangeText={setCustomEnd} placeholder="dd/mm/aaaa" placeholderTextColor="#75839B" style={styles.customPeriodInput} /></View> : null}
          </View>
          <PremiumCard accent="gold" style={styles.vehicleHero}>
            <View style={styles.vehicleIdentity}>
              <View style={styles.vehicleIcon}><MaterialIcons name="directions-car" size={31} color={PREMIUM.gold} /></View>
              <View style={styles.flex}>
                <Text style={styles.vehicleName}>{[vehicleData.profile.marca, vehicleData.profile.modelo].filter(Boolean).join(" ") || "Cadastre seu veículo"}</Text>
                <Text style={styles.vehicleDetails}>{[vehicleData.profile.versao, vehicleData.profile.ano, vehicleData.profile.placa].filter(Boolean).join(" · ") || "Dados opcionais para começar"}</Text>
              </View>
              <View style={[styles.statusPill, vehicleData.profile.status === "ativo" ? styles.statusOk : vehicleData.profile.status === "manutencao" ? styles.statusWarn : styles.statusMuted]}>
                <Text style={styles.statusText}>{vehicleData.profile.status === "ativo" ? "Em uso" : vehicleData.profile.status === "manutencao" ? "Manutenção" : "Inativo"}</Text>
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.odometerRow}>
              <Text style={styles.muted}>Quilometragem atual</Text>
              <Text style={styles.odometerValue}>{km(vehicleData.profile.kmAtual)}</Text>
            </View>
          </PremiumCard>

          <View style={styles.kpiGrid}>
            <KpiCard label="CUSTO NO PERÍODO" value={money(displayedSummary.totalCost)} icon="account-balance-wallet" accent="gold" />
            <KpiCard label="CUSTO / KM" value={money(displayedSummary.operationalCostPerKm)} icon="route" accent="blue" />
            <KpiCard label="CONSUMO MÉDIO" value={decimal(displayedSummary.consumptionKmPerLiter, " km/L")} icon="speed" accent="blue" />
            <KpiCard label="KM NO PERÍODO" value={km(displayedSummary.kmDriven)} icon="timeline" accent="gold" />
          </View>

          <PremiumCard accent="blue" style={styles.costBreakdown}>
            <View style={styles.sectionHeader}><MaterialIcons name="receipt-long" size={22} color={PREMIUM.blue} /><Text style={styles.sectionTitle}>Quanto meu veículo me custa?</Text></View>
            <CostLine label="Combustível" value={displayedSummary.fuelCost} color={PREMIUM.gold} />
            <CostLine label="Manutenção" value={displayedSummary.maintenanceCost} color={PREMIUM.blue} />
            <CostLine label="Seguro" value={displayedSummary.insuranceCost} color={PREMIUM.muted} />
            <CostLine label="Financiamento" value={displayedSummary.financingCost} color={PREMIUM.muted} />
            <CostLine label="Outros" value={displayedSummary.otherCost} color={PREMIUM.muted} />
            <View style={styles.totalLine}><Text style={styles.totalLabel}>CUSTO TOTAL</Text><Text style={styles.totalValue}>{money(displayedSummary.totalCost)}</Text></View>
            <View style={styles.operationalMiniGrid}>
              <MiniMetric label="Custo por OS" value={money(displayedSummary.vehicleCostPerOs)} />
              <MiniMetric label="Custo/dia" value={displayedSummary.kmDriven > 0 ? money(displayedSummary.totalCost / Math.max(1, new Date(ano, mes + 1, 0).getDate())) : "—"} />
              <MiniMetric label="Do faturamento" value={costShare === undefined ? "Mês" : `${costShare.toFixed(1).replace(".", ",")}%`} />
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => setModalKind("custos")}><MaterialIcons name="tune" size={19} color={PREMIUM.blue} /><Text style={styles.secondaryButtonText}>Configurar custos incluídos</Text></Pressable>
          </PremiumCard>

          <PremiumCard accent="blue" style={styles.chartCard}>
            <View style={styles.sectionHeader}><MaterialIcons name="show-chart" size={22} color={PREMIUM.blue} /><Text style={styles.sectionTitle}>Evolução do veículo</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricChips}>
              {([ ["custo", "Custo"], ["combustivel", "Combustível"], ["manutencao", "Manutenção"], ["km", "KM"], ["custoKm", "Custo/km"], ["consumo", "Consumo"], ["custoOs", "Custo/OS"] ] as Array<[ChartMetric, string]>).map(([metric, label]) => (
                <Pressable key={metric} onPress={() => setChartMetric(metric)} style={[styles.metricChip, chartMetric === metric && styles.metricChipActive]}>
                  <Text style={[styles.metricChipText, chartMetric === metric && styles.metricChipTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {chartSeries.some((item) => item.value > 0) ? (
              <BarChart
                data={{ labels: chartSeries.map((item) => item.label), datasets: [{ data: chartSeries.map((item) => item.value) }] }}
                width={chartWidth}
                height={205}
                yAxisLabel="R$ "
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  backgroundColor: PREMIUM.surface,
                  backgroundGradientFrom: PREMIUM.surface,
                  backgroundGradientTo: PREMIUM.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(47, 107, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(184, 193, 209, ${opacity})`,
                  propsForBackgroundLines: { stroke: PREMIUM.divider },
                  propsForLabels: { fontSize: 10 },
                }}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            ) : <EmptyState text="Registre abastecimentos ou manutenções para visualizar esta métrica." icon="show-chart" />}
          </PremiumCard>

          <PremiumCard accent="none" style={styles.insightsCard}>
            <View style={styles.sectionHeader}><MaterialIcons name="auto-awesome" size={21} color={PREMIUM.gold} /><Text style={styles.sectionTitle}>Insights do período</Text></View>
            {displayedSummary.kmDriven > 0 ? <Insight text={`Você percorreu ${km(displayedSummary.kmDriven)} e consumiu ${money(displayedSummary.fuelCost)} em combustível no período.`} /> : null}
            {displayedSummary.osCount > 0 && displayedSummary.vehicleCostPerOs !== undefined ? <Insight text={`O custo médio do veículo por OS foi de ${money(displayedSummary.vehicleCostPerOs)}.`} /> : null}
            {costShare !== undefined ? <Insight text={`O veículo consumiu ${costShare.toFixed(1).replace(".", ",")}% do faturamento estimado do período.`} /> : null}
            {costPerKmVariation !== undefined ? <Insight text={`Seu custo por km ${costPerKmVariation > 0 ? "aumentou" : "reduziu"} ${Math.abs(costPerKmVariation).toFixed(1).replace(".", ",")}% neste mês em relação ao anterior.`} /> : null}
            {displayedSummary.totalCost > 0 && displayedSummary.fuelCost > 0 ? <Insight text={`Combustível representa ${((displayedSummary.fuelCost / displayedSummary.totalCost) * 100).toFixed(1).replace(".", ",")}% dos custos selecionados do veículo.`} /> : null}
            {!displayedSummary.kmDriven && !displayedSummary.osCount ? <EmptyState text="Os insights aparecem somente quando houver dados suficientes." icon="lightbulb-outline" /> : null}
          </PremiumCard>
        </ScrollView>
      )}

      {activeTab === "abastecimentos" && (
        <FlatList
          data={[...fuelMetrics].sort((a, b) => b.data.localeCompare(a.data))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<ListHeader title="Abastecimentos" subtitle={`${money(summary.fuelCost)} no mês · ${decimal(summary.consumptionKmPerLiter, " km/L")}`} action="Registrar abastecimento" icon="add" onPress={() => openFuel()} />}
          ListEmptyComponent={<EmptyState text="Nenhum abastecimento registrado. Adicione o primeiro para acompanhar consumo e custo/km." icon="local-gas-station" />}
          renderItem={({ item }) => <FuelItem item={item} onEdit={() => openFuel(item)} onDelete={() => confirmDelete("este abastecimento", () => removeFuelRecord(item.id))} />}
        />
      )}

      {activeTab === "manutencao" && (
        <FlatList
          data={[...vehicleData.maintenanceRecords].sort((a, b) => b.data.localeCompare(a.data))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<ListHeader title="Manutenção" subtitle={`${money(summary.maintenanceCost)} no mês`} action="Registrar manutenção" icon="add" onPress={() => openMaintenance()} />}
          ListEmptyComponent={<EmptyState text="Nenhuma manutenção registrada. Registre despesas para medir o custo operacional real." icon="build" />}
          renderItem={({ item }) => <MaintenanceItem item={item} onEdit={() => openMaintenance(item)} onDelete={() => confirmDelete("esta manutenção", () => removeMaintenanceRecord(item.id))} />}
        />
      )}

      {activeTab === "planejado" && (
        <FlatList
          data={vehicleData.scheduledMaintenances}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<ListHeader title="Manutenções programadas" subtitle="Alertas por quilometragem e data" action="Programar manutenção" icon="add" onPress={() => openScheduled()} />}
          ListEmptyComponent={<EmptyState text="Programe trocas de óleo, pneus, seguro e outras manutenções preventivas." icon="event-available" />}
          renderItem={({ item }) => <ScheduledItem item={item} currentKm={vehicleData.profile.kmAtual} onEdit={() => openScheduled(item)} onDelete={() => confirmDelete("esta programação", () => removeScheduledMaintenance(item.id))} />}
        />
      )}

      <Modal visible={modalKind !== null} transparent animationType="slide" onRequestClose={() => setModalKind(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTop}><Text style={styles.modalTitle}>{modalKind === "perfil" ? "Dados do veículo" : modalKind === "combustivel" ? editingFuel ? "Editar abastecimento" : "Novo abastecimento" : modalKind === "manutencao" ? editingMaintenance ? "Editar manutenção" : "Nova manutenção" : modalKind === "planejado" ? editingScheduled ? "Editar programação" : "Programar manutenção" : "Custos operacionais"}</Text><Pressable onPress={() => setModalKind(null)}><MaterialIcons name="close" size={26} color={PREMIUM.muted} /></Pressable></View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              {modalKind === "perfil" && <ProfileForm profile={profileForm} onChange={setProfileForm} />}
              {modalKind === "combustivel" && <FuelForm form={fuelForm} onChange={setFuelForm} total={asNumber(fuelForm.litros) * asNumber(fuelForm.precoPorLitro)} />}
              {modalKind === "manutencao" && <MaintenanceForm form={maintenanceForm} onChange={setMaintenanceForm} />}
              {modalKind === "planejado" && <ScheduledForm form={scheduledForm} onChange={setScheduledForm} />}
              {modalKind === "custos" && <CostSettingsForm costs={vehicleData.operationalCosts} onChange={updateOperationalCosts} />}
              <Pressable style={styles.saveButton} onPress={modalKind === "perfil" ? saveProfile : modalKind === "combustivel" ? saveFuel : modalKind === "manutencao" ? saveMaintenance : modalKind === "planejado" ? saveScheduled : () => setModalKind(null)}>
                <MaterialIcons name="save" size={21} color="#FFFFFF" /><Text style={styles.saveButtonText}>{modalKind === "custos" ? "Concluir" : "Salvar"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialIcons>["name"]; accent: "gold" | "blue" }) {
  const color = accent === "gold" ? PREMIUM.gold : PREMIUM.blue;
  return <View style={[styles.kpiCard, { borderColor: accent === "gold" ? PREMIUM.goldBorder : PREMIUM.blueSoft }]}><View style={[styles.kpiIcon, { backgroundColor: accent === "gold" ? "#3C2A09" : "#102B63" }]}><MaterialIcons name={icon} size={20} color={color} /></View><Text style={styles.kpiLabel}>{label}</Text><Text style={[styles.kpiValue, { color }]}>{value}</Text></View>;
}

function CostLine({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={styles.costLine}><Text style={styles.costLabel}>{label}</Text><Text style={[styles.costValue, { color }]}>{money(value)}</Text></View>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.miniMetric}><Text style={styles.miniMetricLabel}>{label}</Text><Text style={styles.miniMetricValue}>{value}</Text></View>;
}

function Insight({ text }: { text: string }) {
  return <View style={styles.insight}><MaterialIcons name="bolt" size={17} color={PREMIUM.gold} /><Text style={styles.insightText}>{text}</Text></View>;
}

function EmptyState({ text, icon }: { text: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  return <View style={styles.emptyState}><MaterialIcons name={icon} size={30} color={PREMIUM.blue} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function ListHeader({ title, subtitle, action, icon, onPress }: { title: string; subtitle: string; action: string; icon: React.ComponentProps<typeof MaterialIcons>["name"]; onPress: () => void }) {
  return <View style={styles.listHeader}><View><Text style={styles.listTitle}>{title}</Text><Text style={styles.listSubtitle}>{subtitle}</Text></View><Pressable style={styles.smallPrimaryButton} onPress={onPress}><MaterialIcons name={icon} size={19} color="#FFFFFF" /><Text style={styles.smallPrimaryButtonText}>{action}</Text></Pressable></View>;
}

function FuelItem({ item, onEdit, onDelete }: { item: ReturnType<typeof calculateFuelMetrics>[number]; onEdit: () => void; onDelete: () => void }) {
  return <PremiumCard accent="none" style={styles.recordCard}><View style={styles.recordTop}><View style={[styles.recordIcon, { backgroundColor: "#3C2A09" }]}><MaterialIcons name="local-gas-station" size={22} color={PREMIUM.gold} /></View><View style={styles.flex}><Text style={styles.recordTitle}>{item.combustivel || "Abastecimento"}</Text><Text style={styles.recordSubtitle}>{item.data} · {km(item.quilometragem)}</Text></View><Text style={styles.recordValue}>{money(item.valorTotal)}</Text></View><View style={styles.recordStats}><Text style={styles.recordStat}>{decimal(item.litros, " L")} · {money(item.precoPorLitro)}/L</Text><Text style={styles.recordStat}>{item.distanciaPercorrida ? `${km(item.distanciaPercorrida)} · ${decimal(item.consumoKmPorLitro, " km/L")}` : "Consumo após o próximo abastecimento"}</Text></View><RecordActions onEdit={onEdit} onDelete={onDelete} /></PremiumCard>;
}

function MaintenanceItem({ item, onEdit, onDelete }: { item: MaintenanceRecord; onEdit: () => void; onDelete: () => void }) {
  return <PremiumCard accent="none" style={styles.recordCard}><View style={styles.recordTop}><View style={[styles.recordIcon, { backgroundColor: "#102B63" }]}><MaterialIcons name="build" size={22} color={PREMIUM.blue} /></View><View style={styles.flex}><Text style={styles.recordTitle}>{item.descricao}</Text><Text style={styles.recordSubtitle}>{item.categoria} · {item.data}{item.oficina ? ` · ${item.oficina}` : ""}</Text></View><Text style={styles.recordValue}>{money(item.valor)}</Text></View>{item.quilometragem ? <Text style={styles.recordStat}>{km(item.quilometragem)}</Text> : null}<RecordActions onEdit={onEdit} onDelete={onDelete} /></PremiumCard>;
}

function ScheduledItem({ item, currentKm, onEdit, onDelete }: { item: ScheduledMaintenance; currentKm?: number; onEdit: () => void; onDelete: () => void }) {
  const status = getScheduledMaintenanceStatus(item, currentKm);
  const statusLabel = status === "vencida" ? "Vencida" : status === "proxima" ? "Próxima" : status === "em_dia" ? "Em dia" : "Sem referência";
  const statusColor = status === "vencida" ? PREMIUM.error : status === "proxima" ? PREMIUM.warning : status === "em_dia" ? PREMIUM.success : PREMIUM.muted;
  return <PremiumCard accent="none" style={styles.recordCard}><View style={styles.recordTop}><View style={[styles.recordIcon, { backgroundColor: "#102B63" }]}><MaterialIcons name="event-available" size={22} color={PREMIUM.blue} /></View><View style={styles.flex}><Text style={styles.recordTitle}>{item.titulo}</Text><Text style={styles.recordSubtitle}>{item.proximaKm ? `Próxima: ${km(item.proximaKm)}` : ""}{item.proximaKm && item.proximaData ? " · " : ""}{item.proximaData ? `Vence: ${item.proximaData}` : ""}</Text></View><View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}><Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text></View></View><RecordActions onEdit={onEdit} onDelete={onDelete} /></PremiumCard>;
}

function RecordActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <View style={styles.recordActions}><Pressable onPress={onEdit} style={styles.iconButton}><MaterialIcons name="edit" size={18} color={PREMIUM.blue} /></Pressable><Pressable onPress={onDelete} style={styles.iconButton}><MaterialIcons name="delete-outline" size={18} color={PREMIUM.error} /></Pressable></View>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default" }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric" }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#75839B" keyboardType={keyboardType} style={styles.input} /></View>;
}

function CategorySelect({ value, onChange }: { value: MaintenanceCategory; onChange: (category: MaintenanceCategory) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>Categoria</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{CATEGORIES.map((category) => <Pressable key={category} onPress={() => onChange(category)} style={[styles.categoryChip, value === category && styles.categoryChipActive]}><Text style={[styles.categoryChipText, value === category && styles.categoryChipTextActive]}>{category}</Text></Pressable>)}</ScrollView></View>;
}

function ProfileForm({ profile, onChange }: { profile: VehicleProfile; onChange: (profile: VehicleProfile) => void }) {
  const value = (key: keyof VehicleProfile) => profile[key] === undefined ? "" : String(profile[key]);
  const set = (key: keyof VehicleProfile, next: string) => onChange({ ...profile, [key]: next });
  return <><Field label="Marca" value={value("marca")} onChangeText={(next) => set("marca", next)} placeholder="Ex.: Fiat" /><Field label="Modelo" value={value("modelo")} onChangeText={(next) => set("modelo", next)} placeholder="Ex.: Strada" /><Field label="Versão" value={value("versao")} onChangeText={(next) => set("versao", next)} placeholder="Opcional" /><Field label="Ano" value={value("ano")} onChangeText={(next) => set("ano", next)} keyboardType="numeric" placeholder="Ex.: 2022" /><Field label="Placa" value={value("placa")} onChangeText={(next) => set("placa", next)} placeholder="Opcional" /><Field label="Combustível" value={value("combustivel")} onChangeText={(next) => set("combustivel", next)} placeholder="Ex.: Gasolina" /><View style={styles.field}><Text style={styles.fieldLabel}>Status do veículo</Text><View style={styles.statusSelector}>{([ ["ativo", "Em uso"], ["manutencao", "Manutenção"], ["inativo", "Inativo"] ] as const).map(([status, label]) => <Pressable key={status} onPress={() => onChange({ ...profile, status })} style={[styles.statusChoice, profile.status === status && styles.statusChoiceActive]}><Text style={[styles.statusChoiceText, profile.status === status && styles.statusChoiceTextActive]}>{label}</Text></Pressable>)}</View></View><Field label="Capacidade do tanque (L)" value={value("capacidadeTanque")} onChangeText={(next) => set("capacidadeTanque", next)} keyboardType="numeric" /><Field label="Quilometragem inicial" value={value("kmInicial")} onChangeText={(next) => set("kmInicial", next)} keyboardType="numeric" /><Field label="Quilometragem atual" value={value("kmAtual")} onChangeText={(next) => set("kmAtual", next)} keyboardType="numeric" /><Field label="Consumo esperado (km/L)" value={value("consumoEsperado")} onChangeText={(next) => set("consumoEsperado", next)} keyboardType="numeric" /><Field label="Preço médio do combustível" value={value("precoMedioCombustivel")} onChangeText={(next) => set("precoMedioCombustivel", next)} keyboardType="numeric" /></>;
}

function FuelForm({ form, onChange, total }: { form: { data: string; quilometragem: string; litros: string; precoPorLitro: string; combustivel: string; posto: string; observacoes: string }; onChange: (form: any) => void; total: number }) {
  return <><Field label="Data" value={form.data} onChangeText={(data) => onChange({ ...form, data })} placeholder="dd/mm/aaaa" /><Field label="Quilometragem" value={form.quilometragem} onChangeText={(quilometragem) => onChange({ ...form, quilometragem })} keyboardType="numeric" /><Field label="Litros abastecidos" value={form.litros} onChangeText={(litros) => onChange({ ...form, litros })} keyboardType="numeric" /><Field label="Preço por litro" value={form.precoPorLitro} onChangeText={(precoPorLitro) => onChange({ ...form, precoPorLitro })} keyboardType="numeric" /><View style={styles.totalPreview}><Text style={styles.totalPreviewLabel}>Valor total calculado</Text><Text style={styles.totalPreviewValue}>{money(total)}</Text></View><Field label="Combustível" value={form.combustivel} onChangeText={(combustivel) => onChange({ ...form, combustivel })} placeholder="Ex.: Gasolina" /><Field label="Posto (opcional)" value={form.posto} onChangeText={(posto) => onChange({ ...form, posto })} /><Field label="Observações" value={form.observacoes} onChangeText={(observacoes) => onChange({ ...form, observacoes })} /></>;
}

function MaintenanceForm({ form, onChange }: { form: { data: string; quilometragem: string; categoria: MaintenanceCategory; descricao: string; valor: string; oficina: string; observacoes: string }; onChange: (form: any) => void }) {
  return <><Field label="Data" value={form.data} onChangeText={(data) => onChange({ ...form, data })} placeholder="dd/mm/aaaa" /><Field label="Quilometragem (opcional)" value={form.quilometragem} onChangeText={(quilometragem) => onChange({ ...form, quilometragem })} keyboardType="numeric" /><CategorySelect value={form.categoria} onChange={(categoria) => onChange({ ...form, categoria })} /><Field label="Descrição" value={form.descricao} onChangeText={(descricao) => onChange({ ...form, descricao })} placeholder="Ex.: Troca de óleo" /><Field label="Valor" value={form.valor} onChangeText={(valor) => onChange({ ...form, valor })} keyboardType="numeric" /><Field label="Oficina (opcional)" value={form.oficina} onChangeText={(oficina) => onChange({ ...form, oficina })} /><Field label="Observações" value={form.observacoes} onChangeText={(observacoes) => onChange({ ...form, observacoes })} /></>;
}

function ScheduledForm({ form, onChange }: { form: { titulo: string; categoria: MaintenanceCategory; proximaKm: string; proximaData: string; observacoes: string }; onChange: (form: any) => void }) {
  return <><Field label="Manutenção" value={form.titulo} onChangeText={(titulo) => onChange({ ...form, titulo })} placeholder="Ex.: Troca de óleo" /><CategorySelect value={form.categoria} onChange={(categoria) => onChange({ ...form, categoria })} /><Field label="Próxima quilometragem" value={form.proximaKm} onChangeText={(proximaKm) => onChange({ ...form, proximaKm })} keyboardType="numeric" placeholder="Ex.: 210000" /><Field label="Vencimento por data" value={form.proximaData} onChangeText={(proximaData) => onChange({ ...form, proximaData })} placeholder="dd/mm/aaaa" /><Field label="Observações" value={form.observacoes} onChangeText={(observacoes) => onChange({ ...form, observacoes })} /></>;
}

function CostSettingsForm({ costs, onChange }: { costs: ReturnType<typeof useVehicle>["vehicleData"]["operationalCosts"]; onChange: (patch: any) => void }) {
  const options: Array<[keyof typeof costs, string]> = [["incluirCombustivel", "Combustível"], ["incluirManutencao", "Manutenção"], ["incluirSeguro", "Seguro"], ["incluirFinanciamento", "Financiamento"], ["incluirOutros", "Outros"]];
  return <><Text style={styles.modalHint}>Escolha quais custos compõem o custo operacional por km. Nenhuma categoria é obrigatória.</Text>{options.map(([key, label]) => <View key={key} style={styles.switchRow}><Text style={styles.switchLabel}>{label}</Text><Switch value={Boolean(costs[key])} onValueChange={(value) => onChange({ [key]: value })} trackColor={{ false: PREMIUM.divider, true: PREMIUM.blueSoft }} thumbColor="#FFFFFF" /></View>)}{costs.incluirSeguro ? <Field label="Seguro mensal" value={String(costs.seguroMensal || "")} onChangeText={(seguroMensal) => onChange({ seguroMensal: asNumber(seguroMensal) })} keyboardType="numeric" /> : null}{costs.incluirFinanciamento ? <Field label="Financiamento mensal" value={String(costs.financiamentoMensal || "")} onChangeText={(financiamentoMensal) => onChange({ financiamentoMensal: asNumber(financiamentoMensal) })} keyboardType="numeric" /> : null}{costs.incluirOutros ? <Field label="Outros custos mensais" value={String(costs.outrosMensais || "")} onChangeText={(outrosMensais) => onChange({ outrosMensais: asNumber(outrosMensais) })} keyboardType="numeric" /> : null}</>;
}

const styles = StyleSheet.create({
  headerShell: { paddingHorizontal: 18, paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerAction: { backgroundColor: PREMIUM.blue, borderRadius: 12, paddingHorizontal: 12, minHeight: 42, flexDirection: "row", gap: 6, alignItems: "center" },
  headerActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 6 },
  tabButton: { flex: 1, minHeight: 45, alignItems: "center", justifyContent: "center", borderRadius: 11, gap: 3, borderWidth: 1, borderColor: "transparent" },
  tabButtonActive: { backgroundColor: PREMIUM.blueDeep, borderColor: PREMIUM.blueSoft },
  tabText: { color: PREMIUM.muted, fontSize: 10, fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  scrollContent: { padding: 18, gap: 14, paddingBottom: 44 },
  periodCard: { backgroundColor: PREMIUM.surface, borderWidth: 1, borderColor: PREMIUM.divider, borderRadius: 15, padding: 12 },
  periodLabel: { color: PREMIUM.muted, fontSize: 10, fontWeight: "800", letterSpacing: .5, marginBottom: 9 },
  periodChips: { gap: 7 },
  periodChip: { borderWidth: 1, borderColor: PREMIUM.divider, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11 },
  periodChipActive: { backgroundColor: PREMIUM.blueDeep, borderColor: PREMIUM.blue },
  periodChipText: { color: PREMIUM.muted, fontSize: 12, fontWeight: "800" },
  periodChipTextActive: { color: "#FFFFFF" },
  customPeriodRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  customPeriodInput: { flex: 1, minHeight: 42, color: PREMIUM.foreground, backgroundColor: PREMIUM.background, borderColor: PREMIUM.divider, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, fontSize: 12 },
  customPeriodSeparator: { color: PREMIUM.muted, fontSize: 12 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: PREMIUM.muted },
  vehicleHero: { padding: 18 },
  vehicleIdentity: { flexDirection: "row", alignItems: "center" },
  vehicleIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: "#2D2109", alignItems: "center", justifyContent: "center", marginRight: 13 },
  flex: { flex: 1 },
  vehicleName: { color: PREMIUM.foreground, fontWeight: "800", fontSize: 19 },
  vehicleDetails: { color: PREMIUM.muted, fontSize: 13, marginTop: 4 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  statusOk: { backgroundColor: "#16492F" }, statusWarn: { backgroundColor: "#3C2A09" }, statusMuted: { backgroundColor: PREMIUM.divider },
  statusText: { color: PREMIUM.foreground, fontSize: 11, fontWeight: "800" },
  heroDivider: { height: 1, backgroundColor: PREMIUM.divider, marginVertical: 16 },
  odometerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  odometerValue: { color: PREMIUM.gold, fontWeight: "800", fontSize: 20 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: { width: "48.5%", backgroundColor: PREMIUM.surface, borderWidth: 1, borderRadius: 16, padding: 13, minHeight: 123 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  kpiLabel: { color: PREMIUM.muted, fontSize: 10, fontWeight: "800", letterSpacing: .4 },
  kpiValue: { fontSize: 18, fontWeight: "900", marginTop: 6 },
  costBreakdown: { gap: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 },
  sectionTitle: { color: PREMIUM.foreground, fontSize: 17, fontWeight: "800", flex: 1 },
  costLine: { minHeight: 37, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomColor: PREMIUM.divider, borderBottomWidth: 1 },
  costLabel: { color: PREMIUM.muted, fontSize: 14 }, costValue: { fontWeight: "800", fontSize: 15 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingTop: 14, marginTop: 4 },
  totalLabel: { color: PREMIUM.foreground, fontSize: 14, fontWeight: "900" }, totalValue: { color: PREMIUM.gold, fontWeight: "900", fontSize: 21 },
  operationalMiniGrid: { flexDirection: "row", gap: 7, marginTop: 18 },
  miniMetric: { flex: 1, backgroundColor: PREMIUM.surfaceRaised, borderRadius: 11, padding: 9 },
  miniMetricLabel: { color: PREMIUM.muted, fontSize: 10, fontWeight: "700" }, miniMetricValue: { color: PREMIUM.foreground, fontWeight: "800", fontSize: 13, marginTop: 5 },
  secondaryButton: { minHeight: 43, borderWidth: 1, borderColor: PREMIUM.blueSoft, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: 15 },
  secondaryButtonText: { color: PREMIUM.blue, fontWeight: "800", fontSize: 13 },
  chartCard: { paddingHorizontal: 12, paddingTop: 16 }, chart: { borderRadius: 12, marginLeft: -12 },
  metricChips: { gap: 7, paddingBottom: 5 }, metricChip: { borderWidth: 1, borderColor: PREMIUM.divider, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 }, metricChipActive: { borderColor: PREMIUM.blue, backgroundColor: PREMIUM.blueDeep }, metricChipText: { color: PREMIUM.muted, fontSize: 11, fontWeight: "800" }, metricChipTextActive: { color: "#FFFFFF" },
  insightsCard: { gap: 8 }, insight: { flexDirection: "row", gap: 9, alignItems: "flex-start", backgroundColor: PREMIUM.surfaceRaised, padding: 11, borderRadius: 11 }, insightText: { color: PREMIUM.muted, fontSize: 13, lineHeight: 19, flex: 1 },
  emptyState: { minHeight: 130, padding: 20, alignItems: "center", justifyContent: "center", gap: 10 }, emptyText: { color: PREMIUM.muted, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 280 },
  listContent: { padding: 18, gap: 11, paddingBottom: 44 }, listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, listTitle: { color: PREMIUM.foreground, fontSize: 22, fontWeight: "900" }, listSubtitle: { color: PREMIUM.muted, fontSize: 13, marginTop: 3 },
  smallPrimaryButton: { maxWidth: 140, backgroundColor: PREMIUM.blue, borderRadius: 11, minHeight: 41, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, smallPrimaryButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", textAlign: "center" },
  recordCard: { padding: 13 }, recordTop: { flexDirection: "row", alignItems: "center", gap: 10 }, recordIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, recordTitle: { color: PREMIUM.foreground, fontSize: 15, fontWeight: "800" }, recordSubtitle: { color: PREMIUM.muted, fontSize: 12, marginTop: 3 }, recordValue: { color: PREMIUM.gold, fontWeight: "900", fontSize: 16 }, recordStats: { gap: 3, marginLeft: 52, marginTop: 9 }, recordStat: { color: PREMIUM.muted, fontSize: 12, marginTop: 8 }, recordActions: { flexDirection: "row", justifyContent: "flex-end", gap: 5, marginTop: 5 }, iconButton: { width: 34, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: PREMIUM.surfaceRaised },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.64)" }, modalSheet: { maxHeight: "91%", backgroundColor: PREMIUM.surface, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderColor: PREMIUM.divider, borderWidth: 1, overflow: "hidden" }, modalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, borderBottomColor: PREMIUM.divider, borderBottomWidth: 1 }, modalTitle: { color: PREMIUM.foreground, fontSize: 19, fontWeight: "900" }, modalContent: { padding: 18, paddingBottom: Platform.OS === "ios" ? 38 : 24 }, modalHint: { color: PREMIUM.muted, lineHeight: 19, marginBottom: 12 },
  field: { marginBottom: 13 }, fieldLabel: { color: PREMIUM.foreground, fontSize: 13, fontWeight: "800", marginBottom: 7 }, input: { minHeight: 48, borderWidth: 1, borderColor: PREMIUM.divider, borderRadius: 11, color: PREMIUM.foreground, paddingHorizontal: 13, fontSize: 15, backgroundColor: PREMIUM.background }, categoryRow: { gap: 7, paddingVertical: 2 }, categoryChip: { borderWidth: 1, borderColor: PREMIUM.divider, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10 }, categoryChipActive: { backgroundColor: PREMIUM.blueDeep, borderColor: PREMIUM.blue }, categoryChipText: { color: PREMIUM.muted, fontSize: 12, fontWeight: "700" }, categoryChipTextActive: { color: "#FFFFFF" },
  statusSelector: { flexDirection: "row", gap: 7 }, statusChoice: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: PREMIUM.divider, alignItems: "center", justifyContent: "center" }, statusChoiceActive: { backgroundColor: PREMIUM.blueDeep, borderColor: PREMIUM.blue }, statusChoiceText: { color: PREMIUM.muted, fontSize: 11, fontWeight: "800" }, statusChoiceTextActive: { color: "#FFFFFF" },
  totalPreview: { backgroundColor: "#2D2109", borderRadius: 12, padding: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }, totalPreviewLabel: { color: PREMIUM.muted, fontSize: 13 }, totalPreviewValue: { color: PREMIUM.gold, fontSize: 18, fontWeight: "900" }, saveButton: { minHeight: 55, marginTop: 8, backgroundColor: PREMIUM.blue, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, switchRow: { minHeight: 51, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomColor: PREMIUM.divider, borderBottomWidth: 1 }, switchLabel: { color: PREMIUM.foreground, fontSize: 15, fontWeight: "700" },
});
