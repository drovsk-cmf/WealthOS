import * as Sentry from "@sentry/nextjs";
import { sanitizePII } from "@/lib/utils/pii-sanitizer";

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = sanitizePII(ex.value);
    }
  }
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) bc.message = sanitizePII(bc.message);
    }
  }
  return event;
}

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    debug: false,
    beforeSend: scrubEvent,
  });
}
