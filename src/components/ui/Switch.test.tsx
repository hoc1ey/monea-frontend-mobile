import { fireEvent, render } from '@testing-library/react-native';

import { Switch } from './Switch';

describe('<Switch />', () => {
  it('reflects the checked state through accessibility', async () => {
    const { getByRole } = await render(
      <Switch value accessibilityLabel="Avisar" onValueChange={jest.fn()} />,
    );

    expect(getByRole('switch').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('reports the opposite value when pressed', async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await render(
      <Switch value={false} accessibilityLabel="Avisar" onValueChange={onValueChange} />,
    );

    await fireEvent.press(getByRole('switch'));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not report when disabled', async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await render(
      <Switch value={false} disabled accessibilityLabel="Avisar" onValueChange={onValueChange} />,
    );

    await fireEvent.press(getByRole('switch'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(getByRole('switch').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
