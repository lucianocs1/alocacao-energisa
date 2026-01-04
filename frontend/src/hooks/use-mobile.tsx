import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const NOTEBOOK_BREAKPOINT = 1366;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };
    
    window.addEventListener("resize", checkTablet);
    checkTablet();
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  return isTablet;
}

export function useIsNotebook() {
  const [isNotebook, setIsNotebook] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkNotebook = () => {
      const width = window.innerWidth;
      setIsNotebook(width >= TABLET_BREAKPOINT && width < NOTEBOOK_BREAKPOINT);
    };
    
    window.addEventListener("resize", checkNotebook);
    checkNotebook();
    return () => window.removeEventListener("resize", checkNotebook);
  }, []);

  return isNotebook;
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'notebook' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setScreenSize('mobile');
      } else if (width < TABLET_BREAKPOINT) {
        setScreenSize('tablet');
      } else if (width < NOTEBOOK_BREAKPOINT) {
        setScreenSize('notebook');
      } else {
        setScreenSize('desktop');
      }
    };
    
    window.addEventListener("resize", checkSize);
    checkSize();
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return screenSize;
}
