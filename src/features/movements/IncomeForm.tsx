import { StyleSheet, Text, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import type { Income } from '@/api/incomes';
import {
  AmountInput,
  Field,
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

import { DateField } from './DateField';

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

type IncomeFormFields = z.infer<typeof schema>;

/** Values emitted by the form; optional fields are omitted for automatic incomes. */
export interface IncomeFormPayload {
  name: string;
  description?: string;
  accountId?: string;
  amount?: number;
  date?: string;
}

export interface IncomeFormProps {
  title: string;
  /** Present when editing an existing income. */
  income?: Income;
  accounts: Account[];
  onBack: () => void;
  onSubmit: (payload: IncomeFormPayload) => Promise<void>;
}

/**
 * Income create/edit form (`movements/income/new`). Automatic incomes
 * (`COLLECTION_INSTALLMENT`, `LOAN_INSTALLMENT`) only allow name and description.
 */
export function IncomeForm({ title, income, accounts, onBack, onSubmit }: IncomeFormProps) {
  const colors = useThemeColors();
  const limited = Boolean(income && income.sourceType !== 'MANUAL');

  const { control, handleSubmit, formState } = useForm<IncomeFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: income?.name ?? '',
      accountId: income?.accountId ?? accounts[0]?.id ?? '',
      amount: income ? String(income.amount) : '',
      date: income ? new Date(income.date) : new Date(),
      description: income?.description ?? '',
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

    if (limited) {
      await onSubmit({
        name: values.name.trim(),
        description: trimmed ? trimmed : undefined,
      });
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      accountId: values.accountId,
      amount: Number(values.amount),
      date: values.date.toISOString(),
      description: trimmed ? trimmed : undefined,
    });
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={title}
        onBack={onBack}
        right={<TextButton title="Guardar" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        {limited ? (
          <Note>
            Este ingreso se generó automáticamente. Solo puedes editar el nombre y la descripción.
          </Note>
        ) : (
          <AmountInput
            value={amount.field.value}
            onChangeText={amount.field.onChange}
            autoFocus={!income}
          />
        )}

        <Group>
          <Field
            label="Nombre"
            placeholder={limited ? '' : 'Ej. Sueldo'}
            maxLength={80}
            value={name.field.value}
            onChangeText={name.field.onChange}
            onBlur={name.field.onBlur}
            error={name.fieldState.error?.message}
          />
          {!limited ? (
            <>
              <Select
                label="Cuenta destino"
                value={account.field.value || undefined}
                options={accountOptions}
                onChange={account.field.onChange}
                placeholder="Seleccionar cuenta"
              />
              <DateField label="Fecha" value={date.field.value} onChange={date.field.onChange} />
            </>
          ) : null}
        </Group>
        {!limited && account.fieldState.error ? (
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
