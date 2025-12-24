import * as crypto from 'crypto';

const BASE91_TABLE = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
  't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', '!', '#', '$', '%', '&', '(', ')', '*', '+', ',', '-', '.', '/', ':',
  ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}', '~'
];

export function guid_for(...values: any[]): string {
  const hash_str = values.map(String).join('__');

  const hash = crypto.createHash('sha256').update(hash_str).digest();

  // get the first 8 bytes of the SHA256 of hash_str as an int
  // In Python: hash_bytes = m.digest()[:8]
  // hash_int = 0
  // for b in hash_bytes: hash_int <<= 8; hash_int += b

  // In JS, working with 64-bit integers can be tricky because `number` is double.
  // But 8 bytes is 64 bits.
  // We can use BigInt.

  let hash_int = 0n;
  for (let i = 0; i < 8; i++) {
    hash_int = (hash_int << 8n) + BigInt(hash[i]);
  }

  // convert to the weird base91 format that Anki uses
  const rv_reversed: string[] = [];
  const base_len = BigInt(BASE91_TABLE.length);

  while (hash_int > 0n) {
    const remainder = hash_int % base_len;
    rv_reversed.push(BASE91_TABLE[Number(remainder)]);
    hash_int /= base_len;
  }

  return rv_reversed.reverse().join('');
}
