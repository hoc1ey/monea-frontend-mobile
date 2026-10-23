import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Account } from '@/api/accounts';
import {
  Field,
  Group,
  LargeHeader,
  ScreenContainer,
  SectionHeader,
  TextButton,
  TopBar
} from '@/components/ui';
import { typography, useThemeColors } from '@/theme';

/** Account color palette; F07 reuses it for credit cards. */
export const ACCOUNT_COLORS = [
  '#fe36c1',
  '#ac086b',
  '#e0068c',
  '#2563eb',
  '#7c3aed',
  '#059669',
] as const;

const schema = z.object({
  name: z.string().min(1, 'Ingresa el alias').max(60, 'Máximo 60 caracteres'),
  financialInstitution: z.string().min(1, 'Ingresa la entidad').max(80, 'Máximo 80 caracteres'),
  initialBalance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máx. 2 decimales)'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Selecciona un color'),
  description: z.string().max(255, 'Máximo 255 caracteres'),
});

type AccountFormFields = z.infer<typeof schema>;

export interface AccountFormValues {
  name: string;
  financialInstitution: string;
  color: string;
  initialBalance: number;
  description?: string;
}

export interface AccountFormProps {
  title: string;
  account?: Account;
  onBack: () => void;
  onSubmit: (values: AccountFormValues) => Promise<void>;
}

/**
 * Shared create/edit account form (`accounts/new`, `accounts/[id]/edit`):
 * fields, color palette and optional description, with a "Guardar" bar action.
 */
export function AccountForm({ title, account, onBack, onSubmit }: AccountFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<AccountFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? '',
      financialInstitution: account?.financialInstitution ?? '',
      initialBalance: account ? String(account.initialBalance) : '0',
      color: account?.color ?? ACCOUNT_COLORS[0],
      description: account?.description ?? '',
    },
  });

  const name = useController({ control, name: 'name' });
  const institution = useController({ control, name: 'financialInstitution' });
  const balance = useController({ control, name: 'initialBalance' });
  const color = useController({ control, name: 'color' });
  const description = useController({ control, name: 'description' });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      financialInstitution: values.financialInstitution.trim(),
      color: values.color,
      initialBalance: Number(values.initialBalance),
      description: values.description.trim() ? values.description.trim() : undefined,
    });
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
            placeholder="Ej. Ahorros"
            value={name.field.value}
            onChangeText={name.field.onChange}
            onBlur={name.field.onBlur}
            error={name.fieldState.error?.message}
          />
          <Field
            label="Entidad"
            placeholder="Ej. Banco"
            value={institution.field.value}
            onChangeText={institution.field.onChange}
            onBlur={institution.field.onBlur}
            error={institution.fieldState.error?.message}
          />
          <Field
            label="Balance inicial"
            placeholder="$0.00"
            keyboardType="decimal-pad"
            value={balance.field.value}
            onChangeText={balance.field.onChange}
            onBlur={balance.field.onBlur}
            error={balance.fieldState.error?.message}
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

        <SectionHeader title="Descripción opcional" />
        <Group>
          <TextInput
            multiline
            placeholder="Ej. Cuenta para gastos del mes"
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
  textarea: {
    ...typography.body,
    minHeight: 90,
    padding: 14,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.footnote,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  button: {
    marginTop: 16,
  },
});
