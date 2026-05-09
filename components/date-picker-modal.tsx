import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelected: (date: string) => void;
  initialDate?: string; // formato: dd/mm/aaaa
}

export function DatePickerModal({
  visible,
  onClose,
  onDateSelected,
  initialDate,
}: DatePickerModalProps) {
  const colors = useColors();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Parse initial date if provided
  useEffect(() => {
    if (initialDate && initialDate.length === 10) {
      const [day, month, year] = initialDate.split('/').map(Number);
      if (day && month && year) {
        setSelectedDay(day);
        setSelectedMonth(month - 1); // Convert to 0-based
        setSelectedYear(year);
      }
    }
  }, [initialDate, visible]);

  function haptic() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // Get days in month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  let firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  // getDay() retorna: 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
  // Calendário brasileiro começa em segunda: seg=0, ter=1, qua=2, qui=3, sex=4, sab=5, dom=6
  // Se for domingo (0), coloca no final (6). Senão, subtrai 1
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  function handleDateConfirm() {
    if (selectedDay) {
      const day = String(selectedDay).padStart(2, '0');
      const month = String(selectedMonth + 1).padStart(2, '0');
      const year = selectedYear;
      const formattedDate = `${day}/${month}/${year}`;
      haptic();
      onDateSelected(formattedDate);
      onClose();
    }
  }

  function previousMonth() {
    haptic();
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function nextMonth() {
    haptic();
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  function previousYear() {
    haptic();
    setSelectedYear(selectedYear - 1);
  }

  function nextYear() {
    haptic();
    setSelectedYear(selectedYear + 1);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Selecione a Data
            </Text>
            <Pressable
              onPress={() => {
                haptic();
                onClose();
              }}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Year Selector */}
            <View style={styles.selectorSection}>
              <Text style={[styles.label, { color: colors.muted }]}>Ano</Text>
              <View style={styles.selectorRow}>
                <Pressable
                  onPress={previousYear}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>
                    ‹
                  </Text>
                </Pressable>
                <Text
                  style={[
                    styles.yearText,
                    { color: colors.foreground, backgroundColor: colors.surface },
                  ]}
                >
                  {selectedYear}
                </Text>
                <Pressable
                  onPress={nextYear}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>
                    ›
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Month Selector */}
            <View style={styles.selectorSection}>
              <Text style={[styles.label, { color: colors.muted }]}>Mês</Text>
              <View style={styles.selectorRow}>
                <Pressable
                  onPress={previousMonth}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>
                    ‹
                  </Text>
                </Pressable>
                <Text
                  style={[
                    styles.monthText,
                    { color: colors.foreground, backgroundColor: colors.surface },
                  ]}
                >
                  {monthNames[selectedMonth]}
                </Text>
                <Pressable
                  onPress={nextMonth}
                  style={({ pressed }) => [
                    styles.arrowButton,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.arrowText, { color: colors.foreground }]}>
                    ›
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarSection}>
              {/* Day names header */}
              <View style={styles.dayNamesRow}>
                {dayNames.map((day, idx) => (
                  <Text
                    key={day}
                    style={[
                      styles.dayNameText,
                      {
                        color: idx === 5 || idx === 6 ? colors.error : colors.muted,
                        flex: 1,
                        textAlign: 'center',
                        fontWeight: idx === 5 || idx === 6 ? '600' : '400',
                      },
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar days grid - 7 columns */}
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => {
                const weekDays = calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7);
                return (
                  <View key={weekIdx} style={styles.calendarWeek}>
                    {weekDays.map((day, dayIdx) => (
                      <Pressable
                        key={weekIdx * 7 + dayIdx}
                        onPress={() => {
                          if (day) {
                            haptic();
                            setSelectedDay(day);
                          }
                        }}
                        disabled={!day}
                        style={({ pressed }) => [
                          styles.dayButton,
                          {
                            backgroundColor:
                              day === selectedDay
                                ? colors.primary
                                : day
                                ? colors.surface
                                : 'transparent',
                            opacity: pressed && day ? 0.8 : 1,
                          },
                        ]}
                      >
                        {day && (
                          <Text
                            style={[
                              styles.dayText,
                              {
                                color:
                                  day === selectedDay ? '#fff' : colors.foreground,
                                fontWeight: day === selectedDay ? '600' : '400',
                              },
                            ]}
                          >
                            {day}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </View>

            {/* Selected Date Display */}
            {selectedDay && (
              <View
                style={[
                  styles.selectedDateDisplay,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.selectedDateLabel, { color: colors.muted }]}>
                  Data Selecionada
                </Text>
                <Text
                  style={[
                    styles.selectedDateValue,
                    { color: colors.primary, fontSize: 18, fontWeight: '600' },
                  ]}
                >
                  {String(selectedDay).padStart(2, '0')}/
                  {String(selectedMonth + 1).padStart(2, '0')}/{selectedYear}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                haptic();
                onClose();
              }}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDateConfirm}
              disabled={!selectedDay}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: selectedDay ? colors.primary : colors.muted,
                  opacity: pressed && selectedDay ? 0.8 : 1,
                },
              ]}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  selectorSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '300',
  },
  yearText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    borderRadius: 8,
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    borderRadius: 8,
  },
  calendarSection: {
    marginBottom: 24,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarWeek: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  selectedDateDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectedDateValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
