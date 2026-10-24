import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { ShoppingListItem } from '@/api/shoppingLists';

import { ItemCard } from './ItemCard';

function makeItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
  return {
    id: 'item-1',
    userId: 'user-1',
    listId: 'list-1',
    name: 'Leche',
    isPurchased: false,
    price: null,
    ...overrides,
  };
}

function noopProps() {
  return {
    onToggle: jest.fn(),
    onSaveName: jest.fn(),
    onSavePrice: jest.fn(),
    onDelete: jest.fn(),
  };
}

describe('<ItemCard /> in normal mode', () => {
  it('shows the name and toggles the checkbox', async () => {
    const props = noopProps();
    const { getByText, getByLabelText } = await render(<ItemCard item={makeItem()} {...props} />);

    expect(getByText('Leche')).toBeTruthy();
    await fireEvent.press(getByLabelText('Leche'));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('deletes the item', async () => {
    const props = noopProps();
    const { getByLabelText } = await render(<ItemCard item={makeItem()} {...props} />);

    await fireEvent.press(getByLabelText('Eliminar Leche'));

    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not show the price field when individual prices are off', async () => {
    const { queryByPlaceholderText } = await render(<ItemCard item={makeItem()} {...noopProps()} />);

    expect(queryByPlaceholderText('$0.00')).toBeNull();
  });
});

describe('<ItemCard /> in edit mode', () => {
  it('renames the item when saving', async () => {
    const props = noopProps();
    const { getByLabelText, getByPlaceholderText, getByText } = await render(
      <ItemCard item={makeItem()} {...props} />,
    );

    await fireEvent.press(getByLabelText('Editar Leche'));
    await fireEvent.changeText(getByPlaceholderText('Nombre del producto'), 'Leche entera');
    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => expect(props.onSaveName).toHaveBeenCalledWith('Leche entera'));
  });

  it('cancels the edition without saving', async () => {
    const props = noopProps();
    const { getByLabelText, getByText } = await render(<ItemCard item={makeItem()} {...props} />);

    await fireEvent.press(getByLabelText('Editar Leche'));
    await fireEvent.press(getByText('Cancelar'));

    expect(props.onSaveName).not.toHaveBeenCalled();
    expect(getByText('Leche')).toBeTruthy();
  });
});

describe('<ItemCard /> with individual prices on', () => {
  it('shows the formatted price and the price input', async () => {
    const { getByText, getByDisplayValue } = await render(
      <ItemCard item={makeItem({ isPurchased: true, price: 1.5 })} pricesOn {...noopProps()} />,
    );

    expect(getByText('$1.50')).toBeTruthy();
    expect(getByDisplayValue('1.5')).toBeTruthy();
  });
});

describe('<ItemCard /> in read-only mode', () => {
  it('renders the item without any modifying control', async () => {
    const props = noopProps();
    const { getByText, queryByPlaceholderText, queryByLabelText } = await render(
      <ItemCard item={makeItem({ isPurchased: true, price: 2.25 })} readOnly {...props} />,
    );

    expect(getByText('Leche')).toBeTruthy();
    expect(getByText('$2.25')).toBeTruthy();
    expect(queryByPlaceholderText('$0.00')).toBeNull();
    expect(queryByLabelText('Editar Leche')).toBeNull();
    expect(queryByLabelText('Eliminar Leche')).toBeNull();
  });

  it('keeps the checkbox disabled, so it cannot toggle', async () => {
    const props = noopProps();
    const { getByLabelText } = await render(
      <ItemCard item={makeItem({ isPurchased: true })} readOnly {...props} />,
    );

    expect(getByLabelText('Leche').props.accessibilityState).toMatchObject({
      checked: true,
      disabled: true,
    });
  });
});

