import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import {
  Field,
  Group,
  LargeHeader,
  Note,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Select,
  Stepper,
  Switch,
  TextButton,
  TopBar,
  WheelSelect,
  type SegmentedOption,
  type SelectOption
} from '@/components/ui';
import { DateField } from '@/features/movements/DateField';
import { formatMoney } from '@/lib/format';
import { typography, useThemeColors } from '@/theme';

import {
  OBLIGATION_KIND_CONFIG,
  type Obligation,
  type ObligationFormPayload,
  type ObligationKind,
} from './obligations';
import {
  buildReminderInput,
  clearReminderForMode,
  DAY_OF_MONTH_OPTIONS,
  defaultReminderState,
  HOUR_OPTIONS,
  initialReminderState,
  MONTH_OPTIONS,
  OPTIONAL_DAY_OF_MONTH_OPTIONS,
  REMINDER_FREQUENCY_OPTIONS,
  reminderModeFor,
  WEEKDAY_OPTIONS,
  type ReminderState,
} from './reminderRules';

function makeSchema(requiresAccount: boolean) {
  return z
    .object({
      personName: z.string().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
      totalAmount: z.string(),
      installmentsCount: z.number().int().min(1, 'Mínimo 1 cuota'),
      description: z.string().max(255, 'Máximo 255 caracteres'),
      accountId: z.string(),
    })
    .superRefine((values, context) => {
      if (!/^\d+(\.\d{1,2})?$/.test(values.totalAmount) || Number(values.totalAmount) <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['totalAmount'],
          message: 'Ingresa un monto mayor a 0',
        });
      }

      if (requiresAccount && !values.accountId) {
        context.addIssue({ code: 'custom', path: ['accountId'], message: 'Selecciona una cuenta' });
      }
    });
}

type ObligationFormFields = z.infer<ReturnType<typeof makeSchema>>;

export interface ObligationFormProps {
  kind: ObligationKind;
  accounts: Account[];
  /** User timezone used to build the ISO UTC `reminderAt`. */
  timezone: string;
  /** Present when editing an existing record. */
  obligation?: Obligation;
  onBack: () => void;
  onSubmit: (payload: ObligationFormPayload) => Promise<void>;
}

/**
 * Generic obligation form (collection / loan / debt) with the reminder rules
 * from F11: a single installment uses a date + hour, several use a recurrence.
 *
 * While editing a loan the account and the total are immutable; once an
 * installment has been paid, the total and the plan are locked too and only
 * the person, the description and the reminder stay editable.
 */
export function ObligationForm({
  kind,
  accounts,
  timezone,
  obligation,
  onBack,
  onSubmit,
}: ObligationFormProps) {
  const colors = useThemeColors();
  const config = OBLIGATION_KIND_CONFIG[kind];
  const schema = useMemo(() => makeSchema(config.hasAccount), [config.hasAccount]);

  const editing = Boolean(obligation);
  const paidCount = obligation?.installments?.filter((installment) => installment.isPaid).length ?? 0;
  const locked = editing && paidCount > 0;
  const amountLocked = editing && (config.hasAccount || locked);
  const installmentsLocked = locked;
  const accountLocked = editing && config.hasAccount;
  const title = editing ? `Editar ${config.singular.toLowerCase()}` : config.newTitle;

  const { control, handleSubmit, formState } = useForm<ObligationFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      personName: obligation?.personName ?? '',
      totalAmount: obligation ? String(obligation.totalAmount) : '',
      installmentsCount: obligation?.installmentsCount ?? 1,
      description:
        obligation && 'description' in obligation ? (obligation.description ?? '') : '',
      accountId:
        (obligation && 'accountId' in obligation ? obligation.accountId : accounts[0]?.id) ?? '',
    },
  });

  const personName = useController({ control, name: 'personName' });
  const totalAmount = useController({ control, name: 'totalAmount' });
  const installmentsCount = useController({ control, name: 'installmentsCount' });
  const description = useController({ control, name: 'description' });
  const account = useController({ control, name: 'accountId' });

  const [reminder, setReminder] = useState<ReminderState>(() =>
    obligation ? initialReminderState(obligation, timezone) : defaultReminderState(),
  );

  const accountOptions: SelectOption<string>[] = accounts.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const sourceAccountName = accounts.find((item) => item.id === account.field.value)?.name ?? '—';

  const mode = reminderModeFor(installmentsCount.field.value);
  const frequencyOptions: SegmentedOption<ReminderState['frequency']>[] = REMINDER_FREQUENCY_OPTIONS;

  const changeInstallments = (next: number) => {
    setReminder((previous) => clearReminderForMode(previous, next));
    installmentsCount.field.onChange(next);
  };

  const submit = handleSubmit(async (values) => {
    const payload: ObligationFormPayload = {
      personName: values.personName.trim(),
      totalAmount: Number(values.totalAmount),
      installmentsCount: values.installmentsCount,
      reminder: buildReminderInput(reminder, values.installmentsCount, timezone),
    };

    if (config.hasDescription) {
      payload.description = values.description.trim();
    }

    if (config.hasAccount) {
      payload.accountId = values.accountId;
    }

    await onSubmit(payload);
  });

  const amountError = totalAmount.fieldState.error?.message;
  const accountError = account.fieldState.error?.message;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={title}
        onBack={onBack}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        <LargeHeader title={title} />

        <Group>
          <Field
            label="Persona"
            placeholder="Nombre"
            maxLength={80}
            value={personName.field.value}
            onChangeText={personName.field.onChange}
            onBlur={personName.field.onBlur}
            error={personName.fieldState.error?.message}
          />
          {amountLocked ? (
            <Field
              label="Monto"
              right={
                <Text style={[styles.readonly, { color: colors.muted }]}>
                  {formatMoney(Number(totalAmount.field.value) || 0)}
                </Text>
              }
            />
          ) : (
            <Field
              label="Monto"
              placeholder="$0.00"
              keyboardType="decimal-pad"
              value={totalAmount.field.value}
              onChangeText={totalAmount.field.onChange}
              onBlur={totalAmount.field.onBlur}
              error={amountError}
            />
          )}
          <Field
            label="Cuotas"
            right={
              installmentsLocked ? (
                <Text style={[styles.readonly, { color: colors.muted }]}>
                  {installmentsCount.field.value}
                </Text>
              ) : (
                <Stepper
                  value={installmentsCount.field.value}
                  min={1}
                  onChange={changeInstallments}
                />
              )
            }
          />
        </Group>

        {locked ? <Note>Bloqueado porque ya hay cuotas pagadas.</Note> : null}

        {config.hasAccount ? (
          <>
            <SectionHeader title="Cuenta de salida" />
            <Group>
              {accountLocked ? (
                <Field
                  label="Cuenta"
                  right={
                    <Text style={[styles.readonly, { color: colors.muted }]}>
                      {sourceAccountName}
                    </Text>
                  }
                />
              ) : (
                <Select
                  label="Cuenta"
                  value={account.field.value || undefined}
                  options={accountOptions}
                  onChange={account.field.onChange}
                  placeholder="Seleccionar cuenta"
                />
              )}
            </Group>
            {!accountLocked && accountError ? (
              <Text style={[styles.error, { color: colors.negative }]}>{accountError}</Text>
            ) : null}
          </>
        ) : null}

        {config.hasDescription ? (
          <>
            <SectionHeader title="Descripción opcional" />
            <Group>
              <TextInput
                multiline
                maxLength={255}
                placeholder="Notas"
                placeholderTextColor={colors.muted}
                value={description.field.value}
                onChangeText={description.field.onChange}
                onBlur={description.field.onBlur}
                style={[styles.textarea, { color: colors.text }]}
              />
              {description.fieldState.error ? (
                <Text style={[styles.error, { color: colors.negative }]}>
                  {description.fieldState.error.message}
                </Text>
              ) : null}
            </Group>
          </>
        ) : null}

        <SectionHeader title="Recordatorio" />
        <Group>
          <Field
            label="Activar recordatorio"
            right={
              <Switch
                value={reminder.enabled}
                onValueChange={(value) => setReminder((previous) => ({ ...previous, enabled: value }))}
                accessibilityLabel="Activar recordatorio"
              />
            }
          />

          {reminder.enabled && mode === 'single' ? (
            <>
              <DateField
                label="Fecha del aviso"
                value={reminder.atDate}
                onChange={(value) => setReminder((previous) => ({ ...previous, atDate: value }))}
              />
              <Select
                label="Hora"
                value={reminder.atHour}
                options={HOUR_OPTIONS}
                onChange={(value) => setReminder((previous) => ({ ...previous, atHour: value }))}
              />
            </>
          ) : null}

          {reminder.enabled && mode === 'recurring' ? (
            <>
              <View style={styles.frequency}>
                <Segmented
                  options={frequencyOptions}
                  value={reminder.frequency}
                  onChange={(value) =>
                    setReminder((previous) => ({ ...previous, frequency: value }))
                  }
                  style={styles.frequencyControl}
                />
              </View>

              {reminder.frequency === 'WEEKLY' ? (
                <Select
                  label="Día"
                  value={reminder.dayOfWeek}
                  options={WEEKDAY_OPTIONS}
                  onChange={(value) =>
                    setReminder((previous) => ({ ...previous, dayOfWeek: value }))
                  }
                />
              ) : null}

              {reminder.frequency === 'MONTHLY' ? (
                <WheelSelect
                  label="Día"
                  value={reminder.dayOfMonth}
                  options={DAY_OF_MONTH_OPTIONS}
                  onChange={(value) =>
                    setReminder((previous) => ({ ...previous, dayOfMonth: value }))
                  }
                />
              ) : null}

              {reminder.frequency === 'YEARLY' ? (
                <>
                  <Select
                    label="Mes"
                    value={reminder.month}
                    options={MONTH_OPTIONS}
                    onChange={(value) => setReminder((previous) => ({ ...previous, month: value }))}
                  />
                  <WheelSelect
                    label="Día del mes"
                    value={reminder.yearDayOfMonth}
                    options={OPTIONAL_DAY_OF_MONTH_OPTIONS}
                    onChange={(value) =>
                      setReminder((previous) => ({ ...previous, yearDayOfMonth: value }))
                    }
                    placeholder="Día 1"
                  />
                </>
              ) : null}

              <Select
                label="Hora"
                value={reminder.hour}
                options={HOUR_OPTIONS}
                onChange={(value) => setReminder((previous) => ({ ...previous, hour: value }))}
              />
            </>
          ) : null}
        </Group>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  frequency: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  frequencyControl: {
    marginTop: 0,
    marginBottom: 0,
  },
  error: {
    ...typography.footnote,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  readonly: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  textarea: {
    ...typography.body,
    minHeight: 90,
    padding: 14,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 16,
  },
});
