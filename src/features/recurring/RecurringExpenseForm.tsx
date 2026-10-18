import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import type {
  RecurringExpenseConfig,
  RecurringExpenseInput,
  RecurringFrequency,
  ReminderOffset,
} from '@/api/recurringExpenses';
import {
  AmountInput,
  Button,
  Field,
  Group,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Select,
  Switch,
  TextButton,
  TopBar,
  type SelectOption,
} from '@/components/ui';
import { DateField } from '@/features/movements/DateField';
import { KIND_OPTIONS, type ExpenseKind } from '@/features/movements/ExpenseForm';
import { formatDate } from '@/lib/format';
import { typography, useThemeColors } from '@/theme';

import {
  DAY_OF_MONTH_OPTIONS,
  FREQUENCY_OPTIONS,
  MONTH_OPTIONS,
  OPTIONAL_DAY_OF_MONTH_OPTIONS,
  REMINDER_HOUR_OPTIONS,
  REMINDER_OFFSET_OPTIONS,
  WEEKDAY_OPTIONS,
} from './recurring';

const schema = z
  .object({
    name: z.string().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
    accountId: z.string().min(1, 'Selecciona una cuenta'),
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    dayOfWeek: z.string(),
    dayOfMonth: z.string(),
    monthOfYear: z.string(),
    yearDayOfMonth: z.string(),
    isVariableAmount: z.boolean(),
    amount: z.string(),
    startDate: z.date(),
    endDate: z.date().nullable(),
    reminderEnabled: z.boolean(),
    reminderOffset: z.enum(['SAME_DAY', 'ONE_DAY_BEFORE']),
    reminderHour: z.string(),
  })
  .superRefine((values, context) => {
    if (!values.isVariableAmount) {
      if (!/^\d+(\.\d{1,2})?$/.test(values.amount) || Number(values.amount) <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: 'Ingresa un monto mayor a 0',
        });
      }
    }

    if (values.frequency === 'WEEKLY') {
      const day = Number(values.dayOfWeek);
      if (!(day >= 1 && day <= 7)) {
        context.addIssue({ code: 'custom', path: ['dayOfWeek'], message: 'Selecciona un día' });
      }
    }

    if (values.frequency === 'MONTHLY') {
      const day = Number(values.dayOfMonth);
      if (!(day >= 1 && day <= 31)) {
        context.addIssue({ code: 'custom', path: ['dayOfMonth'], message: 'Selecciona un día (1–31)' });
      }
    }

    if (values.frequency === 'YEARLY') {
      const month = Number(values.monthOfYear);
      if (!(month >= 1 && month <= 12)) {
        context.addIssue({ code: 'custom', path: ['monthOfYear'], message: 'Selecciona un mes' });
      }
      if (values.yearDayOfMonth !== '') {
        const day = Number(values.yearDayOfMonth);
        if (!(day >= 1 && day <= 31)) {
          context.addIssue({
            code: 'custom',
            path: ['yearDayOfMonth'],
            message: 'Día inválido (1–31)',
          });
        }
      }
    }

    if (values.endDate && values.endDate.getTime() < values.startDate.getTime()) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'La fecha de fin debe ser posterior al inicio',
      });
    }

    if (values.reminderEnabled) {
      const hour = Number(values.reminderHour);
      if (!(hour >= 0 && hour <= 23)) {
        context.addIssue({ code: 'custom', path: ['reminderHour'], message: 'Selecciona una hora' });
      }
    }
  });

type RecurringFormFields = z.infer<typeof schema>;

export interface RecurringExpenseFormProps {
  title: string;
  accounts: Account[];
  /** Present when editing an existing configuration. */
  config?: RecurringExpenseConfig;
  kind: ExpenseKind;
  onKindChange: (kind: ExpenseKind) => void;
  onBack: () => void;
  onSubmit: (input: RecurringExpenseInput) => Promise<void>;
}

function parseCalendarDate(value: string): Date {
  return parseISO(value);
}

interface OptionalDateFieldProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  showSeparator?: boolean;
}

function OptionalDateFieldBase({ label, value, onChange, showSeparator }: OptionalDateFieldProps) {
  const colors = useThemeColors();
  const [show, setShow] = useState(false);
  const display = value ? formatDate(value, 'd MMM yyyy') : 'Opcional';

  return (
    <>
      <Field
        label={label}
        showSeparator={showSeparator}
        right={
          <View style={styles.dateRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${display}`}
              onPress={() => setShow(true)}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={[styles.dateValue, { color: colors.accentInk }]}>{display}</Text>
            </Pressable>
            {value ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar fecha de fin"
                hitSlop={8}
                onPress={() => onChange(null)}
              >
                <Text style={[styles.clear, { color: colors.negative }]}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
      {show ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          onChange={(event, date) => {
            setShow(false);
            if (event.type === 'set' && date) {
              onChange(date);
            }
          }}
        />
      ) : null}
    </>
  );
}

const OptionalDateField = Object.assign(OptionalDateFieldBase, { isGroupItem: true as const });

/**
 * Recurring expense form (segment "Recurrente" of `movements/expense/new`).
 * Creates via `POST /recurring-expenses`; when `config` is present it edits via
 * `PATCH /recurring-expenses/:id`.
 */
export function RecurringExpenseForm({
  title,
  accounts,
  config,
  kind,
  onKindChange,
  onBack,
  onSubmit,
}: RecurringExpenseFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<RecurringFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: config?.name ?? '',
      accountId: config?.accountId ?? accounts[0]?.id ?? '',
      frequency: config?.frequency ?? 'WEEKLY',
      dayOfWeek: config?.dayOfWeek != null ? String(config.dayOfWeek) : '1',
      dayOfMonth: config?.dayOfMonth != null ? String(config.dayOfMonth) : '1',
      monthOfYear: config?.monthOfYear != null ? String(config.monthOfYear) : '1',
      yearDayOfMonth:
        config && config.frequency === 'YEARLY' && config.dayOfMonth != null
          ? String(config.dayOfMonth)
          : '',
      isVariableAmount: config?.isVariableAmount ?? false,
      amount: config?.amount != null ? String(config.amount) : '',
      startDate: config ? parseCalendarDate(config.startDate) : new Date(),
      endDate: config?.endDate ? parseCalendarDate(config.endDate) : null,
      reminderEnabled: config ? config.reminderEnabled : true,
      reminderOffset: config?.reminderOffset ?? 'SAME_DAY',
      reminderHour: config?.reminderHour != null ? String(config.reminderHour) : '9',
    },
  });

  const name = useController({ control, name: 'name' });
  const account = useController({ control, name: 'accountId' });
  const frequency = useController({ control, name: 'frequency' });
  const dayOfWeek = useController({ control, name: 'dayOfWeek' });
  const dayOfMonth = useController({ control, name: 'dayOfMonth' });
  const monthOfYear = useController({ control, name: 'monthOfYear' });
  const yearDayOfMonth = useController({ control, name: 'yearDayOfMonth' });
  const isVariableAmount = useController({ control, name: 'isVariableAmount' });
  const amount = useController({ control, name: 'amount' });
  const startDate = useController({ control, name: 'startDate' });
  const endDate = useController({ control, name: 'endDate' });
  const reminderEnabled = useController({ control, name: 'reminderEnabled' });
  const reminderOffset = useController({ control, name: 'reminderOffset' });
  const reminderHour = useController({ control, name: 'reminderHour' });

  const accountOptions: SelectOption<string>[] = accounts.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const submit = handleSubmit(async (values) => {
    const input: RecurringExpenseInput = {
      accountId: values.accountId,
      name: values.name.trim(),
      frequency: values.frequency,
      isVariableAmount: values.isVariableAmount,
      startDate: format(values.startDate, 'yyyy-MM-dd'),
      reminderEnabled: values.reminderEnabled,
    };

    if (!values.isVariableAmount) {
      input.amount = Number(values.amount);
    }

    if (values.frequency === 'WEEKLY') {
      input.dayOfWeek = Number(values.dayOfWeek);
    } else if (values.frequency === 'MONTHLY') {
      input.dayOfMonth = Number(values.dayOfMonth);
    } else {
      input.monthOfYear = Number(values.monthOfYear);
      if (values.yearDayOfMonth !== '') {
        input.dayOfMonth = Number(values.yearDayOfMonth);
      }
    }

    if (values.endDate) {
      input.endDate = format(values.endDate, 'yyyy-MM-dd');
    }

    if (values.reminderEnabled) {
      input.reminderOffset = values.reminderOffset;
      input.reminderHour = Number(values.reminderHour);
    }

    await onSubmit(input);
  });

  const amountError = amount.fieldState.error?.message;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={title}
        onBack={onBack}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        <View style={styles.segment}>
          <Segmented options={KIND_OPTIONS} value={kind} onChange={onKindChange} />
        </View>

        {!isVariableAmount.field.value ? (
          <AmountInput value={amount.field.value} onChangeText={amount.field.onChange} autoFocus />
        ) : null}

        <Group>
          <Field
            label="Nombre"
            placeholder="Ej. Gimnasio"
            maxLength={80}
            value={name.field.value}
            onChangeText={name.field.onChange}
            onBlur={name.field.onBlur}
            error={name.fieldState.error?.message}
          />
          <Select
            label="Cuenta"
            value={account.field.value || undefined}
            options={accountOptions}
            onChange={account.field.onChange}
            placeholder="Seleccionar cuenta"
          />

          <View style={styles.frequency}>
            <Segmented
              options={FREQUENCY_OPTIONS}
              value={frequency.field.value as RecurringFrequency}
              onChange={frequency.field.onChange}
              style={styles.frequencyControl}
            />
          </View>

          {frequency.field.value === 'WEEKLY' ? (
            <Select
              label="Día"
              value={dayOfWeek.field.value || undefined}
              options={WEEKDAY_OPTIONS}
              onChange={dayOfWeek.field.onChange}
            />
          ) : null}

          {frequency.field.value === 'MONTHLY' ? (
            <Select
              label="Día"
              value={dayOfMonth.field.value || undefined}
              options={DAY_OF_MONTH_OPTIONS}
              onChange={dayOfMonth.field.onChange}
            />
          ) : null}

          {frequency.field.value === 'YEARLY' ? (
            <>
              <Select
                label="Mes"
                value={monthOfYear.field.value || undefined}
                options={MONTH_OPTIONS}
                onChange={monthOfYear.field.onChange}
              />
              <Select
                label="Día del mes"
                value={yearDayOfMonth.field.value || undefined}
                options={OPTIONAL_DAY_OF_MONTH_OPTIONS}
                onChange={yearDayOfMonth.field.onChange}
                placeholder="Día 1"
              />
            </>
          ) : null}

          <Field
            label="Monto variable"
            right={
              <Switch
                value={isVariableAmount.field.value}
                onValueChange={isVariableAmount.field.onChange}
                accessibilityLabel="Monto variable"
              />
            }
          />
          <DateField
            label="Fecha de inicio"
            value={startDate.field.value}
            onChange={startDate.field.onChange}
          />
          <OptionalDateField
            label="Fecha de fin"
            value={endDate.field.value}
            onChange={endDate.field.onChange}
          />
        </Group>
        {amountError ? (
          <Text style={[styles.error, { color: colors.negative }]}>{amountError}</Text>
        ) : null}

        <SectionHeader title="Recordatorio" />
        <Group>
          <Field
            label="Avisar"
            right={
              <Switch
                value={reminderEnabled.field.value}
                onValueChange={reminderEnabled.field.onChange}
                accessibilityLabel="Avisar"
              />
            }
          />
          <Select
            label="Momento"
            value={reminderOffset.field.value as ReminderOffset}
            options={REMINDER_OFFSET_OPTIONS}
            onChange={reminderOffset.field.onChange}
          />
          <Select
            label="Hora"
            value={reminderHour.field.value || undefined}
            options={REMINDER_HOUR_OPTIONS}
            onChange={reminderHour.field.onChange}
          />
        </Group>

        <Button
          title="Guardar recurrencia"
          loading={formState.isSubmitting}
          onPress={submit}
          style={styles.button}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  segment: {
    paddingTop: 8,
  },
  frequency: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  frequencyControl: {
    marginTop: 0,
    marginBottom: 0,
  },
  dateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateValue: {
    ...typography.body,
    fontWeight: '500',
  },
  clear: {
    ...typography.subhead,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  error: {
    ...typography.footnote,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  button: {
    marginTop: 16,
  },
});
