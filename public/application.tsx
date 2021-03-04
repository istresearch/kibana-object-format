import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { StartPlugins } from './types';
import { KibanaObjectFormatApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation }: StartPlugins,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <KibanaObjectFormatApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
