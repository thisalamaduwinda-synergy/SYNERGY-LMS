import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Search,
  Users,
  Video,
} from 'lucide-react';
import '../styles/training-calendar.css';

const trainingEvents = [
  {
    id: 1,
    title: 'GMP Refresher Training',
    date: '2026-05-14',
    time: '09:00 AM',
    duration: '2h',
    department: 'Quality Assurance',
    trainer: 'Dr. N. Perera',
    location: 'Training Room A',
    delivery: 'Classroom',
    attendees: 32,
    capacity: 40,
    status: 'Confirmed',
    priority: 'Mandatory',
    type: 'Compliance',
  },
  {
    id: 2,
    title: 'SOP Change Control Workshop',
    date: '2026-05-16',
    time: '01:30 PM',
    duration: '90m',
    department: 'Manufacturing',
    trainer: 'K. Fernando',
    location: 'Microsoft Teams',
    delivery: 'Virtual',
    attendees: 18,
    capacity: 25,
    status: 'Confirmed',
    priority: 'Recommended',
    type: 'SOP',
  },
  {
    id: 3,
    title: 'Data Integrity Awareness',
    date: '2026-05-20',
    time: '10:00 AM',
    duration: '2h',
    department: 'Laboratory',
    trainer: 'A. Silva',
    location: 'QC Lab Briefing Area',
    delivery: 'Classroom',
    attendees: 26,
    capacity: 30,
    status: 'Pending',
    priority: 'Mandatory',
    type: 'Compliance',
  },
  {
    id: 4,
    title: 'Equipment Cleaning SOP',
    date: '2026-05-23',
    time: '08:30 AM',
    duration: '3h',
    department: 'Production',
    trainer: 'M. Jayasinghe',
    location: 'Production Floor',
    delivery: 'Practical',
    attendees: 14,
    capacity: 16,
    status: 'Confirmed',
    priority: 'Mandatory',
    type: 'Practical',
  },
  {
    id: 5,
    title: 'Pharmacovigilance Basics',
    date: '2026-05-27',
    time: '02:00 PM',
    duration: '2h',
    department: 'Medical Affairs',
    trainer: 'S. Wijeratne',
    location: 'Training Room B',
    delivery: 'Classroom',
    attendees: 21,
    capacity: 35,
    status: 'Draft',
    priority: 'Recommended',
    type: 'Role Based',
  },
  {
    id: 6,
    title: 'CAPA Investigation Skills',
    date: '2026-06-03',
    time: '09:30 AM',
    duration: '4h',
    department: 'Quality Assurance',
    trainer: 'D. Rajapaksha',
    location: 'Training Room A',
    delivery: 'Workshop',
    attendees: 12,
    capacity: 20,
    status: 'Confirmed',
    priority: 'Mandatory',
    type: 'Quality',
  },
];

const filters = ['All', 'Compliance', 'SOP', 'Practical', 'Role Based', 'Quality'];

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');
const getTypeClass = (type) => type.toLowerCase().replace(/\s+/g, '-');

const TrainingCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1));
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(trainingEvents[0].id);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return trainingEvents.filter((event) => {
      const matchesType = selectedType === 'All' || event.type === selectedType;
      const matchesSearch =
        !search ||
        event.title.toLowerCase().includes(search) ||
        event.department.toLowerCase().includes(search) ||
        event.trainer.toLowerCase().includes(search);

      return matchesType && matchesSearch;
    });
  }, [searchTerm, selectedType]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((grouped, event) => {
      grouped[event.date] = grouped[event.date] ? [...grouped[event.date], event] : [event];
      return grouped;
    }, {});
  }, [filteredEvents]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dateKey = toDateKey(date);

      return {
        date,
        dateKey,
        isCurrentMonth: date.getMonth() === month,
        events: eventsByDate[dateKey] || [],
      };
    });
  }, [currentMonth, eventsByDate]);

  const selectedEvent = useMemo(() => {
    return filteredEvents.find((event) => event.id === selectedEventId) || filteredEvents[0];
  }, [filteredEvents, selectedEventId]);

  const monthEventCount = filteredEvents.filter((event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    return (
      eventDate.getMonth() === currentMonth.getMonth() &&
      eventDate.getFullYear() === currentMonth.getFullYear()
    );
  }).length;

  const mandatoryCount = filteredEvents.filter((event) => event.priority === 'Mandatory').length;
  const confirmedCount = filteredEvents.filter((event) => event.status === 'Confirmed').length;
  const totalAttendees = filteredEvents.reduce((total, event) => total + event.attendees, 0);

  const changeMonth = (amount) => {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  return (
    <div className="dashboard-content training-calendar-page">
      <div className="dashboard-header calendar-header">
        <div>
          <h1 className="dashboard-title">Training Calendar</h1>
          <p className="dashboard-subtitle">
            Plan, track, and review upcoming SOP and compliance training sessions.
          </p>
        </div>
        <button className="calendar-primary-btn" type="button">
          <Plus size={18} />
          Schedule Training
        </button>
      </div>

      <div className="calendar-summary-grid">
        <div className="calendar-summary-card">
          <span className="summary-label">This Month</span>
          <strong>{monthEventCount}</strong>
          <span>scheduled sessions</span>
        </div>
        <div className="calendar-summary-card">
          <span className="summary-label">Mandatory</span>
          <strong>{mandatoryCount}</strong>
          <span>required trainings</span>
        </div>
        <div className="calendar-summary-card">
          <span className="summary-label">Confirmed</span>
          <strong>{confirmedCount}</strong>
          <span>ready to run</span>
        </div>
        <div className="calendar-summary-card">
          <span className="summary-label">Participants</span>
          <strong>{totalAttendees}</strong>
          <span>employees enrolled</span>
        </div>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-month-controls">
          <button type="button" className="icon-control" aria-label="Previous month" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="calendar-month-label">
            <CalendarDays size={20} />
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button type="button" className="icon-control" aria-label="Next month" onClick={() => changeMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search training, department, or trainer"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="calendar-filter-row" aria-label="Training type filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`calendar-filter ${selectedType === filter ? 'active' : ''}`}
            onClick={() => setSelectedType(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="calendar-layout">
        <section className="calendar-panel" aria-label="Monthly training calendar">
          <div className="calendar-weekdays">
            {dayNames.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <div
                key={day.dateKey}
                className={`calendar-day ${!day.isCurrentMonth ? 'muted' : ''} ${day.events.length ? 'has-events' : ''}`}
              >
                <span className="calendar-day-number">{day.date.getDate()}</span>
                <div className="calendar-day-events">
                  {day.events.slice(0, 2).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`calendar-event-pill ${getTypeClass(event.type)}`}
                      onClick={() => setSelectedEventId(event.id)}
                      title={event.title}
                    >
                      {event.time} {event.title}
                    </button>
                  ))}
                  {day.events.length > 2 && (
                    <span className="calendar-more-count">+{day.events.length - 2} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="calendar-side-panel">
          <section className="calendar-detail-card">
            <div className="detail-card-header">
              <span className={`training-type ${selectedEvent ? getTypeClass(selectedEvent.type) : ''}`}>
                {selectedEvent?.type || 'No sessions'}
              </span>
              {selectedEvent && (
                <span className={`training-status ${getStatusClass(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              )}
            </div>

            {selectedEvent ? (
              <>
                <h3>{selectedEvent.title}</h3>
                <div className="detail-meta-list">
                  <span>
                    <CalendarDays size={16} />
                    {selectedEvent.date}
                  </span>
                  <span>
                    <Clock size={16} />
                    {selectedEvent.time} - {selectedEvent.duration}
                  </span>
                  <span>
                    {selectedEvent.delivery === 'Virtual' ? <Video size={16} /> : <MapPin size={16} />}
                    {selectedEvent.location}
                  </span>
                  <span>
                    <Users size={16} />
                    {selectedEvent.attendees}/{selectedEvent.capacity} participants
                  </span>
                </div>
                <div className="detail-divider" />
                <div className="detail-field">
                  <span>Department</span>
                  <strong>{selectedEvent.department}</strong>
                </div>
                <div className="detail-field">
                  <span>Trainer</span>
                  <strong>{selectedEvent.trainer}</strong>
                </div>
                <div className="detail-field">
                  <span>Priority</span>
                  <strong>{selectedEvent.priority}</strong>
                </div>
              </>
            ) : (
              <p className="empty-calendar-copy">No matching sessions found.</p>
            )}
          </section>

          <section className="upcoming-list">
            <h3>Upcoming Sessions</h3>
            {filteredEvents.map((event) => (
              <button
                type="button"
                key={event.id}
                className={`upcoming-item ${selectedEvent?.id === event.id ? 'active' : ''}`}
                onClick={() => setSelectedEventId(event.id)}
              >
                <span className="upcoming-date">
                  {monthNames[new Date(`${event.date}T00:00:00`).getMonth()].slice(0, 3)}
                  <strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong>
                </span>
                <span className="upcoming-content">
                  <strong>{event.title}</strong>
                  <small>{event.time} - {event.department}</small>
                </span>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default TrainingCalendar;
