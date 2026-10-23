import { StyleSheet, TextInput, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

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

const schema = z.object({
  name: z.string().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
  itemsText: z.string(),
});

type NewShoppingListFields = z.infer<typeof schema>;

export interface NewShoppingListValues {
  name: string;
  items?: { name: string }[];
}

export interface NewShoppingListFormProps {
  onBack: () => void;
  onSubmit: (values: NewShoppingListValues) => Promise<void>;
}

/** Splits the textarea into the item names (one per line, trimmed, non-empty). */
function parseItems(text: string): { name: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim().slice(0, 120))
    .filter((line) => line.length > 0)
    .map((name) => ({ name }));
}

/**
 * "Nueva lista" form (F14): the name field plus a textarea with the initial
 * products, one per line, sent as `{ name, items }`.
 */
export function NewShoppingListForm({ onBack, onSubmit }: NewShoppingListFormProps) {
  const colors = useThemeColors();

  const { control, handleSubmit, formState } = useForm<NewShoppingListFields>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', itemsText: '' },
  });

  const name = useController({ control, name: 'name' });
  const itemsText = useController({ control, name: 'itemsText' });

  const submit = handleSubmit(async (values) => {
    const items = parseItems(values.itemsText);
    await onSubmit({ name: values.name.trim(), ...(items.length > 0 ? { items } : {}) });
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title="Nueva lista"
        onBack={onBack}
        loading={formState.isSubmitting}
        right={<TextButton title="Crear" disabled={formState.isSubmitting} onPress={submit} />}
      />
      <ScreenContainer>
        <LargeHeader title="Nueva lista" />

        <Group>
          <Field
            label="Nombre"
            placeholder="Ej. Compras de la semana"
            maxLength={80}
            value={name.field.value}
            onChangeText={name.field.onChange}
            onBlur={name.field.onBlur}
            error={name.fieldState.error?.message}
          />
        </Group>

        <SectionHeader title="Productos iniciales" />
        <Group>
          <TextInput
            multiline
            placeholder={'Un producto por línea'}
            placeholderTextColor={colors.muted}
            value={itemsText.field.value}
            onChangeText={itemsText.field.onChange}
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
  button: {
    marginTop: 16,
  },
});
