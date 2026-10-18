import { fireEvent, render } from '@testing-library/react-native';

import { Segmented } from './Segmented';

const OPTIONS = [
  { value: 'open', label: 'Abiertas' },
  { value: 'closed', label: 'Cerradas' },
] as const;

describe('<Segmented />', () => {
  it('renders every option', async () => {
    const { getByText } = await render(
      <Segmented options={[...OPTIONS]} value="open" onChange={jest.fn()} />,
    );

    expect(getByText('Abiertas')).toBeTruthy();
    expect(getByText('Cerradas')).toBeTruthy();
  });

  it('marks the current value as selected', async () => {
    const { getByRole } = await render(
      <Segmented options={[...OPTIONS]} value="closed" onChange={jest.fn()} />,
    );

    expect(getByRole('button', { name: 'Cerradas' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(getByRole('button', { name: 'Abiertas' }).props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it('reports the pressed option', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <Segmented options={[...OPTIONS]} value="open" onChange={onChange} />,
    );

    await fireEvent.press(getByRole('button', { name: 'Cerradas' }));

    expect(onChange).toHaveBeenCalledWith('closed');
  });
});
