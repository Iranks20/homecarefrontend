interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: number;
  patient: string;
  type: 'appointment' | 'break' | 'travel' | 'training';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

interface DragDropCalendarProps {
  date: Date;
  events: CalendarEvent[];
  onEventUpdate: (event: CalendarEvent) => void;
  onEventCreate: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventDelete: (eventId: string) => void;
}

export default function DragDropCalendar(_props: DragDropCalendarProps) {
  // Temporarily disabled drag and drop functionality
  return (
    <div className="p-4 text-center text-gray-500">
      <p>Calendar component temporarily disabled for build</p>
    </div>
  );
}