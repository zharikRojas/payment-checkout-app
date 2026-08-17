type TokenizeInput = {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

/** Tokenize card via our API proxy — never call the payment provider from the browser. */
export async function tokenizeCard(input: TokenizeInput): Promise<string> {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  if (!apiUrl) {
    throw new Error('Configura VITE_API_URL en .env');
  }

  const res = await fetch(`${apiUrl}/payments/card-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      number: input.number.replace(/\s/g, ''),
      cvc: input.cvc,
      expMonth: input.expMonth.padStart(2, '0'),
      expYear: input.expYear.length === 4 ? input.expYear.slice(-2) : input.expYear,
      cardHolder: input.cardHolder,
    }),
  });

  if (!res.ok) {
    throw new Error('No se pudo tokenizar la tarjeta. Revisa los datos e intenta de nuevo.');
  }

  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error('La pasarela no devolvió un token válido.');
  return json.token;
}
