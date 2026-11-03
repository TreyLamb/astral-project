// Pages meant to be shown inside a phone home-screen widget (a web-widget app pointed at the URL).
// They render with NO site chrome: no navbar, no Notes button, no body padding. A widget is a tile,
// not a page you navigate from, so it deliberately carries no HubLink either.
export const WIDGET_ROUTES = ['/schedule-widget'];

export const isWidgetRoute = (pathname) => WIDGET_ROUTES.some((r) => pathname.startsWith(r));
