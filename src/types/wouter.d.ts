import { ComponentType, ReactNode } from 'react';

declare module 'wouter' {
  export interface LocationHook {
    path: string;
    push: (to: string) => void;
    replace: (to: string) => void;
  }

  export function useLocation(): [string, (to: string, replace?: boolean) => void];
  export function useRoute(pattern: string): [boolean, Record<string, string> | null];

  export interface LinkProps {
    href: string;
    children?: ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  }

  export const Link: ComponentType<LinkProps>;

  export interface RouteProps {
    path: string;
    component?: ComponentType<any>;
    children?: ReactNode;
  }

  export const Route: ComponentType<RouteProps>;

  export interface SwitchProps {
    children?: ReactNode;
  }

  export const Switch: ComponentType<SwitchProps>;

  export interface RedirectProps {
    to: string;
  }

  export const Redirect: ComponentType<RedirectProps>;
}

