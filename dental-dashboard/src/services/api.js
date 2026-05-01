import axios from 'axios';

const BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL; // Use Vite proxy
const ENDPOINTS = {
  GET: import.meta.env.VITE_N8N_GET_APPOINTMENTS || '',
  CANCEL: import.meta.env.VITE_N8N_CANCEL_APPOINTMENT || '',
  RESCHEDULE: import.meta.env.VITE_N8N_RESCHEDULE_APPOINTMENT || '',
  COMPLETE: import.meta.env.VITE_N8N_COMPLETE_APPOINTMENT || '',
};

/**
 * Maps a Google Calendar Event JSON into the format the dashboard expects.
 * Handles multiple description formats since the AI doesn't always follow
 * the template exactly.
 */
function mapEvent(event) {
  const desc = event.description || '';
  const summary = event.summary || '';

  // Extract a labeled field like "Patient Name: John" from the description
  // Handles cases where the AI forgets newlines or outputs "n" instead of "\n"
  const extract = (key) => {
    const match = desc.match(new RegExp(key + ':\\s*(.+?)(?=\\n|\\\\n|\\r|n?(?:WhatsApp Number|Date|Time|Clinic|Patient Name|Appointment Type|Status):|$)', 'i'));
    let val = match ? match[1].trim() : '';
    // If the value accidentally caught a stray 'n' at the end before the next key, clean it
    if (val.endsWith('n') && desc.includes(val + 'WhatsApp')) val = val.slice(0, -1).trim();
    return val;
  };

  // --- Service ---
  // The event TITLE (summary) is the most reliable source.
  // Format is usually: "Teeth Whitening - Kishan" or just "Teeth Whitening"
  const KNOWN_SERVICES = [
    'Teeth Whitening', 'Root Canal', 'Tooth Extraction', 'Dental Implant',
    'Orthodontic Consultation', 'Teeth Cleaning', 'Cavity Filling',
    'Gum Treatment', 'Dental Crown', 'X-Ray & Checkup', 'Cleaning',
    'General Consultation', 'Consultation', 'Smile Design', 'Braces',
    'Kids Dental Care', 'Routine Check-up', 'Implants',
  ];

  let service = '';
  const titlePart = summary.split(' - ')[0]?.trim();
  // 1. Title matches a known service
  if (titlePart && KNOWN_SERVICES.some(s => titlePart.toLowerCase().includes(s.toLowerCase()))) {
    service = titlePart;
  }
  // 2. Labeled field in description
  if (!service) service = extract('Appointment Type');
  // 3. First line of description if it's a short plain label with no colon
  if (!service) {
    const firstLine = desc.split(/\n|\r/)[0]?.trim();
    if (firstLine && !firstLine.includes(':') && firstLine.length < 60) {
      service = firstLine;
    }
  }
  // 4. Fallback to raw title part or default
  if (!service) service = titlePart || 'Consultation';

  // --- Patient Name ---
  let name = extract('Patient Name') || extract('Name') || extract("Customer's name");
  if (!name) {
    const parts = summary.split(' - ');
    if (parts.length > 1) {
      name = parts.slice(1).join(' - ').trim();
    } else {
      // Fallback: Check if summary is "Appointment for [Name]" or "Booking for [Name]"
      const match = summary.match(/(?:Appointment|Booking|Consultation) for\s+(.+)/i);
      if (match) name = match[1].trim();
    }
  }
  if (!name) name = 'Unknown Patient';

  // --- Phone ---
  let phone = extract('WhatsApp Number') || extract('Phone');
  if (!phone) {
    const phoneMatch = desc.match(/(\+?91[-\s]?)?([6-9]\d{9})/);
    if (phoneMatch) phone = phoneMatch[0].trim();
  }
  if (!phone) phone = 'N/A';

  // --- Status ---
  const start = new Date(event.start?.dateTime || event.start?.date || Date.now());
  const now = new Date();
  let status = event.status === 'cancelled' ? 'cancelled' : 'confirmed';
  if (desc.includes('Status: Completed')) {
    status = 'completed';
  } else if (status === 'confirmed' && start < now) {
    status = 'completed';
  }

  return {
    id: event.id,
    name,
    phone,
    service,
    date: start.getTime(),
    rawStart: event.start?.dateTime,
    rawEnd: event.end?.dateTime,
    status,
    summary,
    notes: desc,
  };
}

export const api = {
  /**
   * Fetch appointments within a 90-day window
   */
  async getAppointments() {
    try {
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30); // 30 days in the past

      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 60); // 60 days in the future

      const response = await axios.get(`${BASE_URL}${ENDPOINTS.GET}`, {
        params: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString()
        },
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      // Map raw events and filter out hard-deleted ones if necessary
      return response.data.map(mapEvent);
    } catch (error) {
      console.error("Error fetching appointments from n8n:", error);
      throw error;
    }
  },

  /**
   * Cancel an appointment — passes patient details so n8n can notify them via WhatsApp
   */
  async cancelAppointment(eventId, apt = {}) {
    try {
      const response = await axios.post(`${BASE_URL}${ENDPOINTS.CANCEL}`, {
        eventId,
        reason: "Patient requested cancellation via Dashboard",
        // Patient info for WhatsApp notification
        phone: apt.phone || '',
        name: apt.name || '',
        service: apt.service || '',
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      return response.data;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  },

  /**
   * Reschedule an appointment — passes patient details so n8n can notify them via WhatsApp
   */
  async rescheduleAppointment(eventId, newDateString, newTimeString, apt = {}) {
    try {
      // Build IST-offset datetime strings manually to avoid UTC conversion issues
      const pad = (n) => String(n).padStart(2, '0');
      const [year, month, day] = newDateString.split('-');
      const [hour, minute] = newTimeString.split(':');
      const newStart = `${year}-${month}-${day}T${pad(hour)}:${pad(minute)}:00+05:30`;
      const endHour = String(Number(hour) + 1).padStart(2, '0');
      const newEnd = `${year}-${month}-${day}T${endHour}:${pad(minute)}:00+05:30`;

      // Human-readable date/time for the WhatsApp message
      const displayDate = new Date(`${newDateString}T${newTimeString}:00`)
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const displayTime = new Date(`${newDateString}T${newTimeString}:00`)
        .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      const response = await axios.post(`${BASE_URL}${ENDPOINTS.RESCHEDULE}`, {
        eventId,
        newStart,
        newEnd,
        // Patient info + new slot for WhatsApp notification
        phone: apt.phone || '',
        name: apt.name || '',
        service: apt.service || '',
        date: displayDate,
        time: displayTime,
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      return response.data;
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      throw error;
    }
  },

  /**
   * Mark an appointment as completed
   */
  async completeAppointment(eventId) {
    try {
      const response = await axios.post(`${BASE_URL}${ENDPOINTS.COMPLETE}`, {
        eventId: eventId
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error completing appointment:", error);
      throw error;
    }
  }
};
