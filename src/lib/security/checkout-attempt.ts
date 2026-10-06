export const CHECKOUT_ATTEMPT_STORAGE_KEY = 'waqar:checkout-attempt-id';
export const CHECKOUT_ATTEMPT_REUSED_MESSAGE =
  'These checkout details differ from the previous attempt. Please place your order again.';

type AttemptStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateCheckoutAttemptId(
  storage: AttemptStorage,
  createId: () => string = () => crypto.randomUUID(),
) {
  const existing = storage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const attemptId = createId();
  storage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, attemptId);
  return attemptId;
}

export function replaceCheckoutAttemptId(
  storage: AttemptStorage,
  createId: () => string = () => crypto.randomUUID(),
) {
  const attemptId = createId();
  storage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, attemptId);
  return attemptId;
}

export function clearCheckoutAttemptId(storage: AttemptStorage) {
  storage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
}
