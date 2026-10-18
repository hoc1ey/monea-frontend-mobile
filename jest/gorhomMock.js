const React = require('react');
const { View } = require('react-native');

/**
 * Test double for `@gorhom/bottom-sheet`. The real modal pulls in
 * `react-native-reanimated`/`react-native-worklets` native modules that are not
 * available under Jest, but the design-system barrel imports the component, so
 * rendering it inert keeps component tests working.
 */
const Modal = React.forwardRef(function BottomSheetModal(props, ref) {
  React.useImperativeHandle(ref, () => ({ present: () => {}, dismiss: () => {} }));
  return React.createElement(View, props, props.children);
});

const Passthrough = ({ children, ...rest }) => React.createElement(View, rest, children);

module.exports = {
  __esModule: true,
  BottomSheetModal: Modal,
  BottomSheetModalProvider: Passthrough,
  BottomSheetBackdrop: Passthrough,
  BottomSheetView: Passthrough,
  useBottomSheetModal: () => ({ present: () => {}, dismiss: () => {} }),
};
