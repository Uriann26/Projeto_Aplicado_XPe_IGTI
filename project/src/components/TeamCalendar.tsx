import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import type { Task } from '../types';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TeamCalendarProps {
  tasks: Task[];
  onSelectEvent?: (task: Task) => void;
}

export default function TeamCalendar({ tasks, onSelectEvent }: TeamCalendarProps) {
  const events = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: new Date(task.created_at),
    end: task.due_date ? new Date(task.due_date) : new Date(task.created_at),
    allDay: false,
    resource: task,
  }));

  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    let backgroundColor = '';

    switch (task.priority) {
      case 'high':
        backgroundColor = '#FEE2E2';
        break;
      case 'medium':
        backgroundColor = '#FEF3C7';
        break;
      case 'low':
        backgroundColor = '#DBEAFE';
        break;
      default:
        backgroundColor = '#F3F4F6';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: '#374151',
        border: '1px solid',
        borderColor: backgroundColor,
        display: 'block',
      },
    };
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => onSelectEvent?.(event.resource)}
        messages={{
          next: 'Próximo',
          previous: 'Anterior',
          today: 'Hoje',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
          agenda: 'Agenda',
          date: 'Data',
          time: 'Hora',
          event: 'Evento',
          noEventsInRange: 'Não há eventos neste período.',
        }}
      />
    </div>
  );
}