const React = require('react');
const { View, ScrollView } = require('react-native');

/**
 * Pure-JS test double for `react-native-reanimated` (v4). The real library
 * initializes worklets at import time (`runOnUISync`, `createSynchronizable`),
 * which is unsupported on the web environment jest-expo runs in. The app only
 * uses basic animated components and handlers, so plain wrappers are enough.
 */

const useSharedValue = (initial) => ({ value: initial });

const useAnimatedStyle = (style) =>
  typeof style === 'function' ? style() : style;

const useAnimatedScrollHandler = (handler) => (event) => handler(event);

const useDerivedValue = (processor) => ({ value: processor() });

const useAnimatedProps = (processor) =>
  typeof processor === 'function' ? processor() : processor;

const useAnimatedGestureHandler = () => ({});

const useAnimatedReaction = () => {};

const useReducedMotion = () => false;

const cancelAnimation = () => {};

const withTiming = (toValue) => toValue;

const withSpring = (toValue) => toValue;

const withDelay = (_delay, animation) => animation;

const withRepeat = (animation) => animation;

const withSequence = (...animations) => animations[animations.length - 1];

const interpolate = (value, input, output) => {
  if (typeof value !== 'number') {
    return output[0];
  }
  if (value <= input[0]) {
    return output[0];
  }
  for (let i = 1; i < input.length; i += 1) {
    if (value <= input[i]) {
      const t = (value - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + t * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };

const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t,
  cubic: (t) => t,
  in: (t) => t,
  out: (t) => t,
  inOut: (t) => t,
};

const createAnimatedComponent = (Component) => {
  const AnimatedComponent = React.forwardRef(function AnimatedComponent(props, ref) {
    return React.createElement(Component, { ref, ...props });
  });
  return AnimatedComponent;
};

const AnimatedScrollView = createAnimatedComponent(ScrollView);

const Animated = Object.assign(
  createAnimatedComponent(View),
  {
    View: createAnimatedComponent(View),
    ScrollView: AnimatedScrollView,
    FlatList: ({ data, renderItem, ...props }) => null,
    Image: createAnimatedComponent(View),
    Text: createAnimatedComponent(View),
    createAnimatedComponent,
  }
);

const Keyframe = { builder: () => ({ duration: () => null }) };

const BaseAnimationBuilder = function BaseAnimationBuilder() {};

class AnimationBuilder {
  static duration() {
    return AnimationBuilder;
  }
}

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  Extrapolation,
  Easing,
  Keyframe,
  BaseAnimationBuilder: AnimationBuilder,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedProps,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useReducedMotion,
  cancelAnimation,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  clamp,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  createAnimatedComponent,
};
