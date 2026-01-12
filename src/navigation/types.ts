/**
 * Navigation Types
 */

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  MiniApp: {
    appName: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
