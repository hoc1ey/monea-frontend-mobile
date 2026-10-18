const React = require('react');
const { View } = require('react-native');

/**
 * Test double for `lucide-react-native`. The library's `react-native` condition
 * points to ESM (`.mjs`), which Jest cannot transform; tests only need the icon
 * to render, so any named icon resolves to an inert `View`.
 */
const Icon = (props) => React.createElement(View, props);

module.exports = new Proxy(
  {},
  {
    get: () => Icon,
  },
);
