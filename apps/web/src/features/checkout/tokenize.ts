type TokenizeInput = {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

function paymentEnv() {
  const apiUrl = (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  const publicKey = (import.meta.env.VITE_PAYMENT_PUBLIC_KEY as string | undefined) ?? '';
  return { apiUrl, publicKey };
}

export function assertPaymentEnv(): { apiUrl: string; publicKey: string } {
  const { apiUrl, publicKey } = paymentEnv();
  if (!apiUrl || !publicKey) {
    throw new Error('Configura VITE_PAYMENT_* en .env');
  }
  return { apiUrl, publicKey };
}

/** Tokenize card via payment provider (Bearer public key). */
export async function tokenizeCard(input: TokenizeInput): Promise<string> {
  const { apiUrl, publicKey } = assertPaymentEnv();
  const res = await fetch(`${apiUrl}/tokens/cards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: input.number.replace(/\s/g, ''),
      cvc: input.cvc,
      exp_month: input.expMonth.padStart(2, '0'),
      exp_year: input.expYear.length === 4 ? input.expYear.slice(-2) : input.expYear,
      card_holder: input.cardHolder,
    }),
  });
  if (!res.ok) {
    throw new Error('No se pudo tokenizar la tarjeta. Revisa los datos e intenta de nuevo.');
  }
  const json = (await res.json()) as { data?: { id?: string } };
  const token = json.data?.id;
  if (!token) throw new Error('La pasarela no devolvió un token válido.');
  return token;
}

/** Acceptance token from merchant endpoint. */
export async function fetchAcceptanceToken(): Promise<string> {
  const { apiUrl, publicKey } = assertPaymentEnv();
  const res = await fetch(`${apiUrl}/merchants/${publicKey}`);
  if (!res.ok) {
    throw new Error('No se pudo obtener el token de aceptación de la pasarela.');
  }
  const json = (await res.json()) as {
    data?: { presigned_acceptance?: { acceptance_token?: string } };
  };
  const token = json.data?.presigned_acceptance?.acceptance_token;
  if (!token) throw new Error('Respuesta de pasarela sin acceptance_token.');
  return token;
}
