import { useEffect, useState } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

export function useCalendarSync() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Request calendar permissions
  useEffect(() => {
    (async () => {
      try {
        // Check if calendar is available
        const isAvailable = await Calendar.isAvailableAsync();
        if (!isAvailable) {
          console.log('Calendar API not available on this device');
          setIsLoading(false);
          return;
        }

        // Request permissions
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === Calendar.PermissionStatus.GRANTED) {
          setHasPermission(true);
          // Load events for the next 90 days
          await loadUpcomingEvents();
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error requesting calendar permissions:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT) as any[];
      if (calendars.length === 0) {
        setEvents([]);
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

      const calendarIds = calendars.map((cal: any) => cal.id);
      const rawEvents = await Calendar.getEventsAsync(calendarIds, startDate, endDate) as any[];

      // Transform events
      const transformedEvents: CalendarEvent[] = rawEvents.map((event: any) => ({
        id: event.id,
        title: event.title || 'Sem título',
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  // Create event in native calendar
  const createCalendarEvent = async (
    title: string,
    startDate: Date,
    endDate: Date,
    location?: string,
    notes?: string
  ) => {
    try {
      if (!hasPermission) {
        Alert.alert('Permissão necessária', 'Acesso ao calendário não foi concedido');
        return null;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT) as any[];
      const writableCalendars = calendars.filter((cal: any) => cal.allowsModifications);

      if (writableCalendars.length === 0) {
        Alert.alert('Erro', 'Nenhum calendário disponível para criar eventos');
        return null;
      }

      const calendarId = writableCalendars[0].id;

      const eventId = await Calendar.createEventAsync(calendarId, {
        title,
        startDate,
        endDate,
        timeZone: Platform.OS === 'ios' ? 'America/Sao_Paulo' : undefined,
        location,
        notes,
        alarms: [{ relativeOffset: -30 }], // Alerta 30 minutos antes
      });

      // Reload events
      await loadUpcomingEvents();

      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      Alert.alert('Erro', 'Falha ao criar evento no calendário');
      return null;
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toDateString();
    return events.filter((event) => event.startDate.toDateString() === dateStr);
  };

  // Get events for a date range
  const getEventsForRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    return events.filter(
      (event) => event.startDate >= startDate && event.startDate <= endDate
    );
  };

  return {
    events,
    hasPermission,
    isLoading,
    loadUpcomingEvents,
    createCalendarEvent,
    getEventsForDate,
    getEventsForRange,
  };
}
