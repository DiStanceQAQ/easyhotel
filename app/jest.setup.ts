import '@testing-library/jest-native/extend-expect';

jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  return {
    Image: (props: unknown) => React.createElement(Image, props),
  };
});
