export const PAYMENT_METHODS = Object.freeze({
  PACKAGE: "package",
  SANDBOX_CARD: "sandbox_card",
});

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHODS);

export const PAYMENT_KINDS = Object.freeze({
  SESSION: "session",
  PACKAGE_PURCHASE: "package_purchase",
});

export const PAYMENT_STATUS = Object.freeze({
  SUCCEEDED: "succeeded",
  REFUNDED: "refunded",
});