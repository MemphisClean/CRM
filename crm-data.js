// MemphisClean CRM — Data Definitions
const STAGES = ['New Lead','Called','Interested','Appointment Set','Quoted','Won','Lost'];

const SERVICE_OPTIONS = ['Day Porter','Night Porter','Deep Clean','Post-Construction Clean','Recurring Janitorial'];

const OUTCOME_OPTIONS = ['Answered — Interested','Answered — Not Interested','Answered — Callback','Appointment Set','No Answer','Voicemail Left','Wrong Number','Bad Contact — Wrong Person','Do Not Call'];

const USERS = [
  { id:'u1', name:'Khule Khumalo', initials:'KK', color:'#2B3990', pin:'5678' },
];

window.CRM_DATA = {
  contacts: [],
  stages: STAGES,
  services: SERVICE_OPTIONS,
  outcomes: OUTCOME_OPTIONS,
  users: USERS,
};
