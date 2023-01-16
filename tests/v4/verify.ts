import * as assert from 'uvu/assert';

import { PasetoKeyInvalid, PasetoPayloadInvalid, PasetoSignatureInvalid, PasetoTokenInvalid } from '../../src/lib/errors';
import { stringToUint8Array, uint8ArrayToString } from '../../src/lib/uint8array';

import { base64UrlDecode } from '../../src/lib/base64url';
import { generateKeys } from '../../src/v4/key';
import { sign } from '../../src/v4/sign';
import { test } from 'uvu';
import { verify } from '../../src/v4/verify';

globalThis.crypto = crypto;

const keys = {
    secretKey: "k4.secret.FgbULh0ylLoBsG6KRi2ZM0ZDzNMgaCBp1jB0sbf8OXGBf_1Cd0wyDa76n-iN0qGj0vaYSu5QXdZhbj5lUWhkyA",
    publicKey: "k4.public.gX_9QndMMg2u-p_ojdKho9L2mEruUF3WYW4-ZVFoZMg",
}
const PANVA_MESSAGE = JSON.stringify({
    sub: 'napoleon',
    iat: '2023-01-13T14:36:14.754Z',
    exp: '3023-01-09T15:34:46.865Z'
});
const PANVA_TOKEN = 'v4.public.eyJzdWIiOiJuYXBvbGVvbiIsImlhdCI6IjIwMjMtMDEtMTNUMTQ6MzY6MTQuNzU0WiIsImV4cCI6IjMwMjMtMDEtMDlUMTU6MzQ6NDYuODY1WiJ9DwetzN2O8ReSqW1MjRl__QOjIMPg2fTc6HnWdbDHbO74bj4idH20nxfvUG3NTI0k5iMNcWwYAf6dIl3yZ2PJBA';

test('it verifies a PASETO v4.public token generated using the supplied Ed25519 keys', async () => {
    const token = await sign(keys.secretKey, PANVA_MESSAGE);
    const result = verify(keys.publicKey, token);
    assert.is(result.payload.sub, 'napoleon');
});

test('it verifies a PASETO v4.public token generated by panva/paseto', async () => {
    const result = verify(keys.publicKey, PANVA_TOKEN);
    assert.is(result.payload.sub, 'napoleon');
});

test('it verifies a PASETO v4.public token generated by panva/paseto (uint8array input)', async () => {
    const result = verify(keys.publicKey, stringToUint8Array(PANVA_TOKEN));
    assert.is(result.payload.sub, 'napoleon');
});

test('it throws if the token is invalid', async () => {
    try {
        const result = verify(keys.publicKey, 'a' + PANVA_TOKEN);
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoTokenInvalid);
    }
});

test('it throws if the token is invalid', async () => {
    try {
        const result = verify(keys.publicKey, PANVA_TOKEN+'a');
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoSignatureInvalid);
    }
});

test('it throws if the token is invalid (uint8array)', async () => {
    try {
        const result = verify(keys.publicKey, stringToUint8Array('a' + PANVA_TOKEN));
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoTokenInvalid);
    }
});

test('it throws if the token is not a string or uint8array', async () => {
    try {
        const result = verify(keys.publicKey, 1 as any);
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoTokenInvalid);
    }
});

test('it verifies a token with a footer', async () => {
    const token = await sign(keys.secretKey, PANVA_MESSAGE, {
        footer: 'test',
    });
    const result = verify(keys.publicKey, token);
    assert.is(result.payload.sub, 'napoleon');
    assert.is(result.footer, 'test');
});

test('it throws if token has more than 4 parts', async () => {
    try {
        const result = verify(keys.publicKey, PANVA_TOKEN + '.a.b.c');
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoTokenInvalid);
    }
});

test('it throws if payload is less than 64 bytes', async () => {
    try {
        const result = verify(keys.publicKey, 'v4.public.abc');
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoTokenInvalid);
    }
});

test('it uses an assertion if provided', async () => {
    const token = await sign(keys.secretKey, PANVA_MESSAGE, {
        footer: 'test',
        assertion: 'abc'
    });
    const result = verify(keys.publicKey, token, {
        assertion: 'abc'
    });
    assert.is(result.payload.sub, 'napoleon');
    assert.is(result.footer, 'test');
});

test('it fails if assertion is incorrect', async () => {
    const token = await sign(keys.secretKey, PANVA_MESSAGE, {
        footer: 'test',
        assertion: 'abc'
    });
    try {
        const result = verify(keys.publicKey, token, {
            assertion: 'abcd'
        });
        assert.unreachable('should have thrown');
    } catch (err) {
        assert.instance(err, PasetoSignatureInvalid);
    }
});

test.run();