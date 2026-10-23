import { Pressable, StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { CreditCard, CreditCardInput } from '@/api/creditCards';
import {
  Field,
  Group,
  LargeHeader,
  ScreenContainer,
  SectionHeader,
  Switch,
  TextButton,
  TopBar,
  WheelSelect,
  type SelectOption
} from '@/components/ui';
import { ACCOUNT_COLORS } from '@/features/accounts/AccountForm';
import { typography, useThemeColors } from '@/theme';

const DAY_OPTIONS: SelectOption<string>[] = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

const REMINDER_DAY_OPTIONS: SelectOption<string>[] = Array.from({ length: 31 }, (_, index) => ({
  value: String(index),
  label: index === 0 ? 'Mismo día' : index === 1 ? '1 día' : `${index} días`,
}));

const REMINDER_HOUR_OPTIONS: SelectOption<string>[] = Array.from({ length: 24 }, (_, index) => ({
  value: String(index),
  label: `${String(index).padStart(2, '0')}:00`,
}));

const schema = z
  .object({
    name: z.string().min(1, 'Ingresa el alias').max(60, 'Máximo 60 caracteres'),
    issuer: z.string().min(1, 'Ingresa la entidad').max(80, 'Máximo 80 caracteres'),
    lastFourDigits: z.string().regex(/^\d{4}$/, 'Ingresa exactamente 4 dígitos'),
    creditLimit: z
      .string()
      .refine(
        (value) => value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0),
        'Monto inválido (> 0, máx. 2 decimales)',
      ),
    cutoffDay: z.string(),
    paymentDay: z.string(),
    reminderEnabled: z.boolean(),
    reminderDaysBefore: z.string(),
    reminderHour: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Selecciona un color'),
  })
  .superRefine((values, context) => {
    if (values.reminderEnabled && values.paymentDay === '') {
      context.addIssue({
        code: 'custom',
        path: ['paymentDay'],
        message: 'Indica el día de pago para activar el recordatorio',
      });
    }
  });

type CardFormFields = z.infer<typeof schema>;

export interface CardFormProps {
  title: string;
  card?: CreditCard;
  onBack: () => void;
  onSubmit: (values: CreditCardInput) => Promise<void>;
}

/**
 * Shared create/edit credit card form (`cards/new`, `cards/[id]/edit`): card
 * data, cutoff/payment days, reminder and the F06 color palette.
 */
export function CardForm({ title, card, onBack, onSubmit }: CardFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<CardFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: card?.name ?? '',
      issuer: card?.issuer ?? '',
      lastFourDigits: card?.lastFourDigits ?? '',
      creditLimit: card?.creditLimit != null ? String(card.creditLimit) : '',
      cutoffDay: card?.cutoffDay != null ? String(card.cutoffDay) : '',
      paymentDay: card?.paymentDay != null ? String(card.paymentDay) : '',
      reminderEnabled: card ? card.reminderEnabled : true,
      reminderDaysBefore: card ? String(card.reminderDaysBefore) : '1',
      reminderHour: card ? String(card.reminderHour) : '9',
      color: card?.color ?? ACCOUNT_COLORS[0],
    },
  });

  const name = useController({ control, name: 'name' });
  const issuer = useController({ control, name: 'issuer' });
  const lastFour = useController({ control, name: 'lastFourDigits' });
  const creditLimit = useController({ control, name: 'creditLimit' });
  const cutoffDay = useController({ control, name: 'cutoffDay' });
  const paymentDay = useController({ control, name: 'paymentDay' });
  const reminderEnabled = useController({ control, name: 'reminderEnabled' });
  const reminderDaysBefore = useController({ control, name: 'reminderDaysBefore' });
  const reminderHour = useController({ control, name: 'reminderHour' });
  const color = useController({ control, name: 'color' });

  const submit = handleSubmit(async (values) => {
    const input: CreditCardInput = {
      name: values.name.trim(),
      color: values.color,
      issuer: values.issuer.trim(),
      lastFourDigits: values.lastFourDigits,
      reminderEnabled: values.reminderEnabled,
    };

    if (values.creditLimit !== '') {
      input.creditLimit = Number(values.creditLimit);
    }
    if (values.cutoffDay !== '') {
      input.cutoffDay = Number(values.cutoffDay);
    } else if (card?.cutoffDay != null) {
      input.cutoffDay = null;
    }
    if (values.paymentDay !== '') {
      input.paymentDay = Number(values.paymentDay);
    } else if (card?.paymentDay != null) {
      input.paymentDay = null;
    }
    if (values.reminderEnabled) {
      input.reminderDaysBefore = Number(values.reminderDaysBefore);
      input.reminderHour = Number(values.reminderHour);
    }

    await onSubmit(input);
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={title}
        onBack={onBack}
        loading={formState.isSubmitting}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        <LargeHeader title={title} />

        <Group>
          <Field
            label="Alias"
            placeholder="Ej. Visa"
            value={name.field.value}
            onChangeText={name.field.onChange}
            onBlur={name.field.onBlur}
            error={name.fieldState.error?.message}
          />
          <Field
            label="Entidad emisora"
            placeholder="Ej. Banco"
            value={issuer.field.value}
            onChangeText={issuer.field.onChange}
            onBlur={issuer.field.onBlur}
            error={issuer.fieldState.error?.message}
          />
          <Field
            label="Últimos 4 dígitos"
            placeholder="0000"
            keyboardType="number-pad"
            maxLength={4}
            value={lastFour.field.value}
            onChangeText={lastFour.field.onChange}
            onBlur={lastFour.field.onBlur}
            error={lastFour.fieldState.error?.message}
          />
          <Field
            label="Cupo"
            placeholder="$0.00"
            keyboardType="decimal-pad"
            value={creditLimit.field.value}
            onChangeText={creditLimit.field.onChange}
            onBlur={creditLimit.field.onBlur}
            error={creditLimit.fieldState.error?.message}
          />
        </Group>

        <SectionHeader title="Fechas" />
        <Group>
          <WheelSelect
            label="Día de corte"
            value={cutoffDay.field.value || undefined}
            options={DAY_OPTIONS}
            placeholder="Sin definir"
            onChange={cutoffDay.field.onChange}
            onClear={() => cutoffDay.field.onChange('')}
          />
          <WheelSelect
            label="Día de pago"
            value={paymentDay.field.value || undefined}
            options={DAY_OPTIONS}
            placeholder="Sin definir"
            onChange={paymentDay.field.onChange}
            onClear={() => paymentDay.field.onChange('')}
          />
        </Group>
        {paymentDay.fieldState.error ? (
          <Text style={[styles.error, { color: colors.negative }]}>
            {paymentDay.fieldState.error.message}
          </Text>
        ) : null}

        <SectionHeader title="Recordatorio" />
        <Group>
          <Field
            label="Avisar antes del pago"
            right={
              <Switch
                value={reminderEnabled.field.value}
                onValueChange={reminderEnabled.field.onChange}
                accessibilityLabel="Avisar antes del pago"
              />
            }
          />
          <WheelSelect
            label="Antelación"
            value={reminderDaysBefore.field.value}
            options={REMINDER_DAY_OPTIONS}
            onChange={reminderDaysBefore.field.onChange}
          />
          <WheelSelect
            label="Hora del aviso"
            value={reminderHour.field.value}
            options={REMINDER_HOUR_OPTIONS}
            onChange={reminderHour.field.onChange}
          />
        </Group>

        <SectionHeader title="Color" />
        <Group>
          <View style={styles.swatches}>
            {ACCOUNT_COLORS.map((option) => {
              const selected = option.toLowerCase() === color.field.value.toLowerCase();

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${option}`}
                  accessibilityState={{ selected }}
                  hitSlop={8}
                  onPress={() => color.field.onChange(option)}
                  style={styles.swatchWrap}
                >
                  <View style={[styles.swatch, { backgroundColor: option }]} />
                  {selected ? (
                    <View style={[styles.swatchRing, { borderColor: colors.text }]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Group>

      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  swatchWrap: {
    width: 30,
    height: 30,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  swatchRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 19,
    borderWidth: 2,
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
