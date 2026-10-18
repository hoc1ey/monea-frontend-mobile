import {
  buildReminderInput,
  clearReminderForMode,
  defaultReminderState,
  initialReminderState,
  reminderModeFor,
  type ReminderState,
} from './reminderRules';

const TZ = 'America/Guayaquil';

describe('reminderModeFor', () => {
  it('uses a single exact reminder for one installment', () => {
    expect(reminderModeFor(1)).toBe('single');
  });

  it('uses a recurrence for more than one installment', () => {
    expect(reminderModeFor(2)).toBe('recurring');
    expect(reminderModeFor(6)).toBe('recurring');
  });
});

describe('clearReminderForMode', () => {
  const base: ReminderState = {
    ...defaultReminderState(),
    frequency: 'WEEKLY',
    dayOfWeek: '5',
    dayOfMonth: '12',
    month: '3',
    yearDayOfMonth: '20',
    atDate: new Date(2026, 9, 16),
    atHour: '18',
    hour: '18',
  };

  it('resets recurrence fields when going down to one installment', () => {
    const next = clearReminderForMode(base, 1);
    expect(next).toMatchObject({
      frequency: 'MONTHLY',
      dayOfWeek: '1',
      dayOfMonth: '1',
      month: '1',
      yearDayOfMonth: '',
      hour: '9',
    });
  });

  it('resets the exact date fields when going up to several installments', () => {
    const next = clearReminderForMode(base, 3);
    expect(next).toMatchObject({ atHour: '9' });
    expect(next.frequency).toBe('WEEKLY');
  });
});

describe('buildReminderInput', () => {
  it('only disables the reminder when it is off', () => {
    const state = { ...defaultReminderState(), enabled: false };
    expect(buildReminderInput(state, 3, TZ)).toEqual({ reminderEnabled: false });
  });

  it('sends an exact UTC instant for a single installment, minutes and seconds at 0', () => {
    const state: ReminderState = {
      ...defaultReminderState(),
      atDate: new Date(2026, 9, 16, 0, 0, 0),
      atHour: '9',
    };

    const input = buildReminderInput(state, 1, TZ);
    expect(input.reminderEnabled).toBe(true);
    expect(input.reminderAt).toBe(new Date('2026-10-16T14:00:00.000Z').toISOString());
  });

  it('sends the weekly recurrence with the selected day', () => {
    const state: ReminderState = {
      ...defaultReminderState(),
      frequency: 'WEEKLY',
      dayOfWeek: '3',
      hour: '10',
    };

    expect(buildReminderInput(state, 3, TZ)).toEqual({
      reminderEnabled: true,
      reminderFrequency: 'WEEKLY',
      reminderHour: 10,
      reminderDayOfWeek: 3,
    });
  });

  it('sends the monthly recurrence with the selected day of month', () => {
    const state: ReminderState = {
      ...defaultReminderState(),
      frequency: 'MONTHLY',
      dayOfMonth: '15',
      hour: '8',
    };

    expect(buildReminderInput(state, 3, TZ)).toEqual({
      reminderEnabled: true,
      reminderFrequency: 'MONTHLY',
      reminderHour: 8,
      reminderDayOfMonth: 15,
    });
  });

  it('sends the yearly recurrence and omits the day when it is the default', () => {
    const state: ReminderState = {
      ...defaultReminderState(),
      frequency: 'YEARLY',
      month: '6',
      yearDayOfMonth: '',
      hour: '9',
    };

    expect(buildReminderInput(state, 3, TZ)).toEqual({
      reminderEnabled: true,
      reminderFrequency: 'YEARLY',
      reminderHour: 9,
      reminderMonth: 6,
    });
  });

  it('sends the yearly day of month when it is selected', () => {
    const state: ReminderState = {
      ...defaultReminderState(),
      frequency: 'YEARLY',
      month: '6',
      yearDayOfMonth: '20',
    };

    const input = buildReminderInput(state, 3, TZ);
    expect(input.reminderMonth).toBe(6);
    expect(input.reminderDayOfMonth).toBe(20);
  });
});

describe('initialReminderState', () => {
  it('rebuilds a single-installment reminder from reminderAt', () => {
    const state = initialReminderState(
      {
        reminderEnabled: true,
        reminderFrequency: null,
        reminderDayOfWeek: null,
        reminderDayOfMonth: null,
        reminderMonth: null,
        reminderAt: '2026-10-16T14:00:00.000Z',
        reminderHour: null,
        installmentsCount: 1,
      },
      TZ,
    );

    expect(state.enabled).toBe(true);
    expect(state.atHour).toBe('9');
    expect(state.atDate.getDate()).toBe(16);
  });

  it('rebuilds a recurring reminder and maps the yearly day', () => {
    const state = initialReminderState(
      {
        reminderEnabled: false,
        reminderFrequency: 'YEARLY',
        reminderDayOfWeek: null,
        reminderDayOfMonth: 20,
        reminderMonth: 6,
        reminderAt: null,
        reminderHour: 8,
        installmentsCount: 4,
      },
      TZ,
    );

    expect(state.enabled).toBe(false);
    expect(state.frequency).toBe('YEARLY');
    expect(state.month).toBe('6');
    expect(state.yearDayOfMonth).toBe('20');
    expect(state.hour).toBe('8');
  });
});
