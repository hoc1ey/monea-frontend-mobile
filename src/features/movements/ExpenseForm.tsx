import { StyleSheet, Text, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import type { Expense } from '@/api/expenses';
import {
  AmountInput,
  Field,
  Group,
  Note,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Select,
  TextButton,
  TopBar,
  type SegmentedOption,
  type SelectOption
} from '@/components/ui';
import { typography, useThemeColors } from '@/theme';

import { DateField } from './DateField';

export type ExpenseKind = 'instant' | 'diferido' | 'recurrente';

export const KIND_OPTIONS: SegmentedOption<ExpenseKind>[] = [
  { value: 'instant', label: 'Instantáneo' },
  { value: 'diferido', label: 'Diferido' },
  { value: 'recurrente', label: 'Recurrente' },
];

const schema = z.object({
  name: z.string().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
  accountId: z.string().min(1, 'Selecciona una cuenta'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máx. 2 decimales)')
    .refine((value) => Number(value) > 0, 'El monto debe ser mayor a 0'),
  date: z.date(),
  description: z.string().max(255, 'Máximo 255 caracteres'),
});

type ExpenseFormFields = z.infer<typeof schema>;

/** Values emitted by the instant expense form. */
export interface ExpenseFormPayload {
  name: string;
  accountId: string;
  amount: number;
  description?: string;
  date: string;
}

export interface ExpenseFormProps {
  title: string;
  /** Present when editing an existing instant expense. */
  expense?: Expense;
  accounts: Account[];
  kind?: ExpenseKind;
  onKindChange?: (kind: ExpenseKind) => void;
  onBack: () => void;
  onSubmit: (payload: ExpenseFormPayload) => Promise<void>;
}

/**
 * Instant expense form (`movements/expense/new`). The segmented control switches
 * the type; "Instantáneo" lives here, "Diferido" is F09 and "Recurrente" is F10.
 */
export function ExpenseForm({
  title,
  expense,
  accounts,
  kind = 'instant',
  onKindChange,
  onBack,
  onSubmit,
}: ExpenseFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<ExpenseFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: expense?.name ?? '',
      accountId: expense?.accountId ?? accounts[0]?.id ?? '',
      amount: expense ? String(expense.amount) : '',
      date: expense ? new Date(expense.date) : new Date(),
      description: expense?.description ?? '',
    },
  });

  const name = useController({ control, name: 'name' });
  const account = useController({ control, name: 'accountId' });
  const amount = useController({ control, name: 'amount' });
  const date = useController({ control, name: 'date' });
  const description = useController({ control, name: 'description' });

  const accountOptions: SelectOption<string>[] = accounts.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const submit = handleSubmit(async (values) => {
    const trimmed = values.description.trim();
    await onSubmit({
      name: values.name.trim(),
      accountId: values.accountId,
      amount: Number(values.amount),
      date: values.date.toISOString(),
      description: trimmed ? trimmed : undefined,
    });
  });

  if (!expense && kind !== 'instant') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title={title} onBack={onBack} />
        <ScreenContainer>
          <View style={styles.segment}>
            <Segmented options={KIND_OPTIONS} value={kind} onChange={(value) => onKindChange?.(value)} />
          </View>
          <Note>
            {kind === 'diferido'
              ? 'El egreso diferido se implementa en la feature de diferidos (F09).'
              : 'El egreso recurrente se implementa en la feature de recurrentes (F10).'}
          </Note>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={title}
        onBack={onBack}
        loading={formState.isSubmitting}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        {expense ? null : (
          <View style={styles.segment}>
            <Segmented options={KIND_OPTIONS} value={kind} onChange={(value) => onKindChange?.(value)} />
          </View>
        )}
        <AmountInput
          value={amount.field.value}
          onChangeText={amount.field.onChange}
          autoFocus={!expense}
        />

        <Group>
          <Field
            label="Nombre"
            placeholder="Ej. Almuerzo"
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
          <Field
            label="Forma de pago"
            right={<Text style={[styles.staticValue, { color: colors.muted }]}>Corriente (contado)</Text>}
          />
          <DateField label="Fecha" value={date.field.value} onChange={date.field.onChange} />
        </Group>
        {account.fieldState.error ? (
          <Text style={[styles.error, { color: colors.negative }]}>
            {account.fieldState.error.message}
          </Text>
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
  staticValue: {
    ...typography.body,
  },
  textarea: {
    ...typography.body,
    minHeight: 90,
    padding: 14,
    textAlignVertical: 'top',
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
