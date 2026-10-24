import { StyleSheet, Text, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import type { CreditCard } from '@/api/creditCards';
import {
  AmountInput,
  Field,
  Group,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Select,
  Stepper,
  TextButton,
  TopBar,
  type SelectOption
} from '@/components/ui';
import { DateField } from '@/features/movements/DateField';
import { KIND_OPTIONS, type ExpenseKind } from '@/features/movements/ExpenseForm';
import { typography, useThemeColors } from '@/theme';

const schema = z.object({
  name: z.string().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
  accountId: z.string().min(1, 'Selecciona una cuenta'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máx. 2 decimales)')
    .refine((value) => Number(value) > 0, 'El monto debe ser mayor a 0'),
  creditCardId: z.string().min(1, 'Selecciona una tarjeta'),
  installments: z.number().int().min(1, 'Mínimo 1 cuota'),
  graceMonths: z.number().int().min(0, 'Mínimo 0 meses'),
  date: z.date(),
  description: z.string().max(255, 'Máximo 255 caracteres'),
});

type DeferredFormFields = z.infer<typeof schema>;

/** Values emitted by the deferred expense form. */
export interface DeferredExpenseFormPayload {
  name: string;
  accountId: string;
  amount: number;
  creditCardId: string;
  installments: number;
  graceMonths: number;
  date: string;
  description?: string;
}

export interface DeferredExpenseFormProps {
  title: string;
  accounts: Account[];
  cards: CreditCard[];
  kind: ExpenseKind;
  onKindChange: (kind: ExpenseKind) => void;
  onBack: () => void;
  onSubmit: (payload: DeferredExpenseFormPayload) => Promise<void>;
}

/**
 * Deferred expense form (segment "Diferido" inside `movements/expense/new`).
 * The account is required by the API because the period payment is charged to
 * it, but the account balance does not change until that payment happens.
 */
export function DeferredExpenseForm({
  title,
  accounts,
  cards,
  kind,
  onKindChange,
  onBack,
  onSubmit,
}: DeferredExpenseFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<DeferredFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      accountId: accounts[0]?.id ?? '',
      amount: '',
      creditCardId: cards[0]?.id ?? '',
      installments: 3,
      graceMonths: 0,
      date: new Date(),
      description: '',
    },
  });

  const name = useController({ control, name: 'name' });
  const account = useController({ control, name: 'accountId' });
  const amount = useController({ control, name: 'amount' });
  const card = useController({ control, name: 'creditCardId' });
  const installments = useController({ control, name: 'installments' });
  const grace = useController({ control, name: 'graceMonths' });
  const date = useController({ control, name: 'date' });
  const description = useController({ control, name: 'description' });

  const accountOptions: SelectOption<string>[] = accounts.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const cardOptions: SelectOption<string>[] = cards.map((item) => ({
    value: item.id,
    label: `${item.name} ·${item.lastFourDigits}`,
  }));

  const submit = handleSubmit(async (values) => {
    const trimmed = values.description.trim();
    await onSubmit({
      name: values.name.trim(),
      accountId: values.accountId,
      amount: Number(values.amount),
      creditCardId: values.creditCardId,
      installments: values.installments,
      graceMonths: values.graceMonths,
      date: values.date.toISOString(),
      description: trimmed ? trimmed : undefined,
    });
  });

  const selectionError = account.fieldState.error?.message ?? card.fieldState.error?.message;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={title}
        onBack={onBack}
        loading={formState.isSubmitting}
        right={
          <TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />
        }
      />
      <ScreenContainer>
        <View style={styles.segment}>
          <Segmented options={KIND_OPTIONS} value={kind} onChange={onKindChange} />
        </View>
        <AmountInput value={amount.field.value} onChangeText={amount.field.onChange} autoFocus />

        <Group>
          <Field
            label="Nombre"
            placeholder="Ej. Laptop"
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
          <Select
            label="Tarjeta"
            value={card.field.value || undefined}
            options={cardOptions}
            onChange={card.field.onChange}
            placeholder="Seleccionar tarjeta"
          />
          <Field
            label="Cuotas"
            right={
              <Stepper value={installments.field.value} onChange={installments.field.onChange} min={1} />
            }
          />
          <Field
            label="Meses de gracia"
            right={<Stepper value={grace.field.value} onChange={grace.field.onChange} min={0} />}
          />
          <DateField label="Fecha de compra" value={date.field.value} onChange={date.field.onChange} />
        </Group>
        {selectionError ? (
          <Text style={[styles.error, { color: colors.negative }]}>{selectionError}</Text>
        ) : null}

        <SectionHeader title="Descripción opcional" />
        <Group>
          <TextInput
            multiline
            placeholder="Notas"
            placeholderTextColor={colors.muted}
            value={description.field.value}
            onChangeText={description.field.onChange}
            onBlur={description.field.onBlur}
            style={[styles.textarea, { color: colors.text }]}
          />
        </Group>
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
  help: {
    ...typography.footnote,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  error: {
    ...typography.footnote,
    paddingHorizontal: 14,
    paddingTop: 8,
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
