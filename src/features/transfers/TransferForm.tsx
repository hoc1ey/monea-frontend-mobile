import { StyleSheet, Text, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import {
  AmountInput,
  Group,
  Note,
  ScreenContainer,
  SectionHeader,
  Select,
  TextButton,
  TopBar,
  type SelectOption
} from '@/components/ui';
import { typography, useThemeColors } from '@/theme';

import { DateField } from '@/features/movements/DateField';

const schema = z
  .object({
    sourceAccountId: z.string().min(1, 'Selecciona la cuenta origen'),
    destinationAccountId: z.string().min(1, 'Selecciona la cuenta destino'),
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máx. 2 decimales)')
      .refine((value) => Number(value) > 0, 'El monto debe ser mayor a 0'),
    date: z.date(),
    description: z.string().max(255, 'Máximo 255 caracteres'),
  })
  .superRefine((values, ctx) => {
    if (
      values.sourceAccountId &&
      values.sourceAccountId === values.destinationAccountId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationAccountId'],
        message: 'La cuenta origen y la cuenta destino deben ser distintas',
      });
    }
  });

type TransferFormFields = z.infer<typeof schema>;

/** Values emitted by the transfer form. */
export interface TransferFormPayload {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
  date: string;
}

export interface TransferFormProps {
  accounts: Account[];
  onBack: () => void;
  onSubmit: (payload: TransferFormPayload) => Promise<void>;
}

/**
 * Transfer form (`transfers/new`): moves money between two own accounts.
 * The API generates one expense in the source account and one income in the
 * destination account, so both selects must point to different accounts.
 */
export function TransferForm({ accounts, onBack, onSubmit }: TransferFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<TransferFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceAccountId: accounts[0]?.id ?? '',
      destinationAccountId: accounts[1]?.id ?? '',
      amount: '',
      date: new Date(),
      description: '',
    },
  });

  const source = useController({ control, name: 'sourceAccountId' });
  const destination = useController({ control, name: 'destinationAccountId' });
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
      sourceAccountId: values.sourceAccountId,
      destinationAccountId: values.destinationAccountId,
      amount: Number(values.amount),
      date: values.date.toISOString(),
      description: trimmed ? trimmed : undefined,
    });
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title="Nueva transferencia"
        onBack={onBack}
        loading={formState.isSubmitting}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        <AmountInput value={amount.field.value} onChangeText={amount.field.onChange} autoFocus />

        <Group>
          <Select
            label="Cuenta origen"
            value={source.field.value || undefined}
            options={accountOptions}
            onChange={source.field.onChange}
            placeholder="Seleccionar cuenta"
          />
          <Select
            label="Cuenta destino"
            value={destination.field.value || undefined}
            options={accountOptions}
            onChange={destination.field.onChange}
            placeholder="Seleccionar cuenta"
          />
          <DateField label="Fecha" value={date.field.value} onChange={date.field.onChange} />
        </Group>
        {source.fieldState.error ? (
          <Text style={[styles.error, { color: colors.negative }]}>
            {source.fieldState.error.message}
          </Text>
        ) : null}
        {destination.fieldState.error ? (
          <Text style={[styles.error, { color: colors.negative }]}>
            {destination.fieldState.error.message}
          </Text>
        ) : null}
        {amount.fieldState.error ? (
          <Text style={[styles.error, { color: colors.negative }]}>
            {amount.fieldState.error.message}
          </Text>
        ) : null}

        <Note>
          Se registrará un egreso en la cuenta origen y un ingreso en la cuenta destino.
        </Note>

        <SectionHeader title="Descripción opcional" />
        <Group>
          <TextInput
            multiline
            placeholder="Ej. Pago del alquiler"
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
});
