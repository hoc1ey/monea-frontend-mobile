import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import {
  Button,
  Field,
  Group,
  LargeHeader,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Select,
  Stepper,
  Switch,
  TextButton,
  TopBar,
  type SegmentedOption,
  type SelectOption,
} from '@/components/ui';
import { DateField } from '@/features/movements/DateField';
import { typography, useThemeColors } from '@/theme';

import {
  OBLIGATION_KIND_CONFIG,
  type ObligationFormPayload,
  type ObligationKind,
} from './obligations';
import {
  buildReminderInput,
  clearReminderForMode,
  DAY_OF_MONTH_OPTIONS,
  defaultReminderState,
  HOUR_OPTIONS,
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
  onBack: () => void;
  onSubmit: (payload: ObligationFormPayload) => Promise<void>;
}

/**
 * Generic obligation form (collection / loan / debt) with the reminder rules
 * from F11: a single installment uses a date + hour, several use a recurrence.
 */
export function ObligationForm({
  kind,
  accounts,
  timezone,
  onBack,
  onSubmit,
}: ObligationFormProps) {
  const colors = useThemeColors();
  const config = OBLIGATION_KIND_CONFIG[kind];
  const schema = useMemo(() => makeSchema(config.hasAccount), [config.hasAccount]);

  const { control, handleSubmit, formState } = useForm<ObligationFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      personName: '',
      totalAmount: '',
      installmentsCount: 1,
      description: '',
      accountId: accounts[0]?.id ?? '',
    },
  });

  const personName = useController({ control, name: 'personName' });
  const totalAmount = useController({ control, name: 'totalAmount' });
  const installmentsCount = useController({ control, name: 'installmentsCount' });
  const description = useController({ control, name: 'description' });
  const account = useController({ control, name: 'accountId' });

  const [reminder, setReminder] = useState<ReminderState>(defaultReminderState);

  const accountOptions: SelectOption<string>[] = accounts.map((item) => ({
    value: item.id,
    label: item.name,
  }));

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

    if (config.hasDescription && values.description.trim()) {
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
        title={config.newTitle}
        onBack={onBack}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        <LargeHeader title={config.newTitle} />

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
          <Field
            label="Monto"
            placeholder="$0.00"
            keyboardType="decimal-pad"
            value={totalAmount.field.value}
            onChangeText={totalAmount.field.onChange}
            onBlur={totalAmount.field.onBlur}
            error={amountError}
          />
          <Field
            label="Cuotas"
            right={
              <Stepper
                value={installmentsCount.field.value}
                min={1}
                onChange={changeInstallments}
              />
            }
          />
          {config.hasDescription ? (
            <Field
              label="Descripción"
              placeholder="Opcional"
              maxLength={255}
              value={description.field.value}
              onChangeText={description.field.onChange}
            />
          ) : null}
        </Group>

        {config.hasAccount ? (
          <>
            <SectionHeader title="Cuenta de salida" />
            <Group>
              <Select
                label="Cuenta"
                value={account.field.value || undefined}
                options={accountOptions}
                onChange={account.field.onChange}
                placeholder="Seleccionar cuenta"
              />
            </Group>
            {accountError ? (
              <Text style={[styles.error, { color: colors.negative }]}>{accountError}</Text>
            ) : null}
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
                <Select
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
                  <Select
                    label="Día del mes"
                    value={reminder.yearDayOfMonth || undefined}
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

        <Button
          title="Guardar"
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
  button: {
    marginTop: 16,
  },
});
